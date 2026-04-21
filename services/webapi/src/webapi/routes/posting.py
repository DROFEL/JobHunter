from fastapi import APIRouter

router = APIRouter(prefix="/postings", tags=["users"])


@router.get("")
def list_postings():
    return [{"id": 1, "name": "Alice"}]


@router.get("/{posting_id}")
def get_posting(user_id: int):
    return {"id": user_id}