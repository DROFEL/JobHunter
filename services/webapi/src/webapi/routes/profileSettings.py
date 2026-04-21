from fastapi import APIRouter

router = APIRouter(prefix="/profileSettings", tags=["users"])


@router.get("")
def list_profileSettings():
    return [{"id": 1, "name": "Alice"}]