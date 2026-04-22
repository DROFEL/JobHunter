from typing import Annotated
from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from db.models.user import User
from webapi.models.user import UserData, UserResponse, UserUpsertRequest
from db.session import get_fastapi_db

router = APIRouter(prefix="/users", tags=["users"])

def get_external_user_id(
    Authentication: Annotated[str | None, Header()] = None,
) -> str:
    if not Authentication:
        raise HTTPException(status_code=401, detail="Missing Authentication header")
    return Authentication


def normalize_user_data(data: dict | None) -> dict:
    normalized = dict(data or {})

    if "skillPool" not in normalized and isinstance(normalized.get("skillTypes"), list):
        normalized["skillPool"] = [
            skill
            for skill_type in normalized["skillTypes"]
            if isinstance(skill_type, dict)
            for skill in skill_type.get("skills", [])
            if isinstance(skill, str)
        ]

    normalized.pop("skillTypes", None)

    return UserData.model_validate(normalized).model_dump()


def merge_user_data(existing_data: dict | None, updates: dict) -> dict:
    merged = normalize_user_data(existing_data)

    for key, value in updates.items():
        if key == "profile" and isinstance(value, dict):
            merged["profile"] = {
                **dict(merged.get("profile") or {}),
                **value,
            }
            continue

        merged[key] = value

    return normalize_user_data(merged)


@router.get("", response_model=UserResponse)
def get_user(external_user_id: str = Depends(get_external_user_id), db: Session = Depends(get_fastapi_db)):
    user = db.query(User).filter(User.user_external_id == external_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.data = normalize_user_data(user.data)
    return user




@router.post("", response_model=UserResponse)
def upsert_single_user(
    payload: UserUpsertRequest,
    response: Response,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user = db.query(User).filter(User.user_external_id == external_user_id).first()
    merged_data = merge_user_data(
        user.data if user is not None else None,
        payload.data.model_dump(exclude_unset=True),
    )

    if user is None:
        user = User(
            user_external_id=external_user_id,
            data=merged_data,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        response.status_code = status.HTTP_201_CREATED
        return user

    user.data = merged_data
    db.commit()
    db.refresh(user)
    return user


@router.patch("", response_model=UserResponse)
def patch_single_user(
    payload: UserUpsertRequest,
    external_user_id: str = Depends(get_external_user_id),
    db: Session = Depends(get_fastapi_db),
):
    user = db.query(User).filter(User.user_external_id == external_user_id).first()

    if user is None:
        user = User(
            user_external_id=external_user_id,
            data=merge_user_data(None, payload.data.model_dump(exclude_unset=True)),
        )
        db.add(user)
    else:
        user.data = merge_user_data(user.data, payload.data.model_dump(exclude_unset=True))

    db.commit()
    db.refresh(user)
    return user
