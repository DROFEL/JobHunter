import json
from datetime import datetime, timezone
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.models.search_config import SearchConfig
from db.models.user import User
from db.session import get_fastapi_db
from webapi.producer import delivery_report, producer

router = APIRouter(prefix="/searches", tags=["searches"])


def _get_external_user_id(Authentication: Annotated[str | None, Header()] = None) -> str:
    if not Authentication:
        raise HTTPException(status_code=401, detail="Missing Authentication header")
    return Authentication


def _get_user_uuid(external_user_id: str, db: Session) -> UUID:
    user = db.query(User).filter(User.user_external_id == external_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.user_id


def _to_response(cfg: SearchConfig) -> dict[str, Any]:
    return {
        "id": str(cfg.search_config_id),
        "board": cfg.board,
        "params": cfg.params,
        "results_wanted": cfg.results_wanted,
        "status": cfg.status,
        "total_scraped": cfg.total_scraped,
        "created_at": cfg.created_at.isoformat() if cfg.created_at else None,
        "updated_at": cfg.updated_at.isoformat() if cfg.updated_at else None,
    }


class SearchConfigCreate(BaseModel):
    board: str
    params: dict[str, Any] = {}
    results_wanted: int = 25


class SearchConfigPatch(BaseModel):
    model_config = {"extra": "allow"}
    board: str | None = None
    params: dict[str, Any] | None = None
    results_wanted: int | None = None


@router.get("")
def list_searches(
    external_user_id: str = Depends(_get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = _get_user_uuid(external_user_id, db)
    configs = db.query(SearchConfig).filter(SearchConfig.user_id == user_uuid).all()
    return [_to_response(c) for c in configs]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_search(
    payload: SearchConfigCreate,
    external_user_id: str = Depends(_get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = _get_user_uuid(external_user_id, db)
    cfg = SearchConfig(
        user_id=user_uuid,
        board=payload.board,
        params=payload.params,
        results_wanted=payload.results_wanted,
        status="Idle",
        total_scraped=0,
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return _to_response(cfg)


@router.patch("/{search_id}")
def patch_search(
    search_id: UUID,
    payload: SearchConfigPatch,
    external_user_id: str = Depends(_get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = _get_user_uuid(external_user_id, db)
    cfg = (
        db.query(SearchConfig)
        .filter(SearchConfig.search_config_id == search_id, SearchConfig.user_id == user_uuid)
        .first()
    )
    if not cfg:
        raise HTTPException(status_code=404, detail="Search config not found")
    if cfg.status == "Running":
        raise HTTPException(status_code=409, detail="Cannot edit a running search")
    if payload.board is not None:
        cfg.board = payload.board
    if payload.params is not None:
        cfg.params = payload.params
    if payload.results_wanted is not None:
        cfg.results_wanted = payload.results_wanted
    cfg.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(cfg)
    return _to_response(cfg)


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_search(
    search_id: UUID,
    external_user_id: str = Depends(_get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = _get_user_uuid(external_user_id, db)
    cfg = (
        db.query(SearchConfig)
        .filter(SearchConfig.search_config_id == search_id, SearchConfig.user_id == user_uuid)
        .first()
    )
    if not cfg:
        raise HTTPException(status_code=404, detail="Search config not found")
    db.delete(cfg)
    db.commit()


@router.post("/{search_id}/dispatch", status_code=status.HTTP_202_ACCEPTED)
def dispatch_search(
    search_id: UUID,
    external_user_id: str = Depends(_get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user_uuid = _get_user_uuid(external_user_id, db)
    cfg = (
        db.query(SearchConfig)
        .filter(SearchConfig.search_config_id == search_id, SearchConfig.user_id == user_uuid)
        .first()
    )
    if not cfg:
        raise HTTPException(status_code=404, detail="Search config not found")
    if cfg.status == "Running":
        raise HTTPException(status_code=409, detail="Search is already running")

    cfg.status = "Running"
    cfg.updated_at = datetime.now(timezone.utc)
    db.commit()

    producer.produce(
        topic="searches.discover",
        key=str(cfg.search_config_id),
        value=json.dumps({"search_config_id": str(cfg.search_config_id)}),
        on_delivery=delivery_report,
    )
    producer.flush(timeout=5)
    return _to_response(cfg)
