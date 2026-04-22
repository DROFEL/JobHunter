from confluent_kafka import Producer

from typing import Annotated, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.models.posting import Posting
from db.models.user import User
from db.session import get_fastapi_db
from webapi.models.posting import JobResume, PostingData

router = APIRouter(prefix="/jobs", tags=["jobs"])


def get_external_user_id(
    Authentication: Annotated[str | None, Header()] = None,
) -> str:
    if not Authentication:
        raise HTTPException(status_code=401, detail="Missing Authentication header")
    return Authentication


def get_user_uuid(external_user_id: str, db: Session) -> UUID:
    user = db.query(User).filter(User.user_external_id == external_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.user_id


_POSTING_DATA_DEFAULTS: dict[str, Any] = PostingData().model_dump(mode="json")

def _to_response(posting: Posting) -> dict[str, Any]:
    data = {**_POSTING_DATA_DEFAULTS, **(posting.data or {})}
    data["id"] = str(posting.posting_id)
    data["scrapeStatus"] = posting.scrapeStatus
    return data


class ResumePatchPayload(BaseModel):
    resume: JobResume


class JobPatchPayload(BaseModel):
    model_config = {"extra": "allow"}


@router.get("")
def list_jobs(
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    postings = db.query(Posting).filter(Posting.user_id == user_uuid).all()
    # print([_to_response(p) for p in postings])
    return [_to_response(p) for p in postings]


@router.get("/{job_id}")
def get_job(
    job_id: UUID,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    posting = (
        db.query(Posting)
        .filter(Posting.posting_id == job_id, Posting.user_id == user_uuid)
        .first()
    )
    if not posting:
        raise HTTPException(status_code=404, detail="Job not found")
    return _to_response(posting)


@router.post("/scrape", status_code=status.HTTP_202_ACCEPTED)
def scrape_job(
    payload: dict[str, Any],
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    p = Producer({"bootstrap.servers": "localhost:9094"})

    def delivery_report(err, msg):
        if err is not None:
            print(f"Delivery failed: {err}")
        else:
            print(f"Delivered to {msg.topic()} [{msg.partition()}] @ offset {msg.offset()}")

    p.produce(
        "jobs",
        key="job-123",
        value='{"jobId":"job-123","url":"https://example.com"}',
        callback=delivery_report,
    )
    p.flush()

@router.post("", status_code=status.HTTP_201_CREATED)
def create_job(
    payload: PostingData,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    posting = Posting(user_id=user_uuid, data=payload.to_db())
    db.add(posting)
    db.commit()
    db.refresh(posting)
    return _to_response(posting)


@router.patch("/{job_id}/resume")
def update_job_resume(
    job_id: UUID,
    payload: ResumePatchPayload,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    posting = (
        db.query(Posting)
        .filter(Posting.posting_id == job_id, Posting.user_id == user_uuid)
        .first()
    )
    if not posting:
        raise HTTPException(status_code=404, detail="Job not found")

    data = PostingData.from_db(posting.data)
    data.resume = payload.resume
    data.title = payload.resume.targetPosition or payload.resume.position or data.title
    data.company = payload.resume.targetCompany or data.company
    posting.data = data.to_db()
    db.commit()
    db.refresh(posting)
    return _to_response(posting)


@router.patch("/{job_id}")
def patch_job(
    job_id: UUID,
    payload: dict[str, Any],
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    posting = (
        db.query(Posting)
        .filter(Posting.posting_id == job_id, Posting.user_id == user_uuid)
        .first()
    )
    if not posting:
        raise HTTPException(status_code=404, detail="Job not found")

    data = PostingData.from_db(posting.data)
    updated = data.model_copy(update=payload)
    posting.data = updated.to_db()
    db.commit()
    db.refresh(posting)
    return _to_response(posting)


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: UUID,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    posting = (
        db.query(Posting)
        .filter(Posting.posting_id == job_id, Posting.user_id == user_uuid)
        .first()
    )
    if not posting:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(posting)
    db.commit()
