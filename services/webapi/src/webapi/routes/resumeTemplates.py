from typing import Annotated, Any
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.models.resume_template import ResumeTemplate
from db.models.user import User
from db.session import get_db

router = APIRouter(prefix="/resume-templates", tags=["resume-templates"])


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


class ResumeTemplateData(BaseModel):
    position: str = ""
    summary: str = ""
    targetPosition: str = ""
    targetCompany: str = ""
    jobPostingLink: str = ""
    aiJobSummary: str = ""
    experiences: list[dict[str, Any]] = []
    projects: list[dict[str, Any]] = []
    skillTypes: list[dict[str, Any]] = []


class ResumeTemplateResponse(BaseModel):
    id: str
    name: str
    data: ResumeTemplateData

    model_config = {"from_attributes": True}


class ResumeTemplateCreate(BaseModel):
    name: str
    data: ResumeTemplateData = ResumeTemplateData()


class ResumeTemplatePatch(BaseModel):
    name: str | None = None
    data: ResumeTemplateData | None = None


def _to_response(template: ResumeTemplate) -> ResumeTemplateResponse:
    return ResumeTemplateResponse(
        id=str(template.id),
        name=template.name or "",
        data=ResumeTemplateData(**(template.data or {})),
    )


@router.get("", response_model=list[ResumeTemplateResponse])
def list_templates(
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    templates = db.query(ResumeTemplate).filter(ResumeTemplate.user_id == user_uuid).all()
    return [_to_response(t) for t in templates]


@router.get("/{template_id}", response_model=ResumeTemplateResponse)
def get_template(
    template_id: UUID,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    template = (
        db.query(ResumeTemplate)
        .filter(ResumeTemplate.user_id == user_uuid, ResumeTemplate.id == template_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return _to_response(template)


@router.post("", response_model=ResumeTemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: ResumeTemplateCreate,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    template = ResumeTemplate(
        user_id=user_uuid,
        name=payload.name,
        data=payload.data.model_dump(),
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return _to_response(template)


@router.patch("/{template_id}", response_model=ResumeTemplateResponse)
def patch_template(
    template_id: UUID,
    payload: ResumeTemplatePatch,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    template = (
        db.query(ResumeTemplate)
        .filter(ResumeTemplate.id == template_id, ResumeTemplate.user_id == user_uuid)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if payload.name is not None:
        template.name = payload.name
    if payload.data is not None:
        template.data = payload.data.model_dump()

    db.commit()
    db.refresh(template)
    return _to_response(template)


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: UUID,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_db),
):
    user_uuid = get_user_uuid(external_user_id, db)
    template = (
        db.query(ResumeTemplate)
        .filter(ResumeTemplate.id == template_id, ResumeTemplate.user_id == user_uuid)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
