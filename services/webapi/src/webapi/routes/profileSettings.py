from fastapi import APIRouter

router = APIRouter(prefix="/profileSettings", tags=["profile-settings"])


@router.get("")
def list_profileSettings():
    return [{"id": 1, "name": "Alice"}]