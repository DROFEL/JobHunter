import io
import json

from common.minio import client as minio_client

_BUCKET = "browser-sessions"


def _ensure_bucket() -> None:
    if not minio_client.bucket_exists(_BUCKET):
        minio_client.make_bucket(_BUCKET)


def save_browser_session(session_id: str, storage_state: dict) -> str:
    """Persist Playwright storage_state (cookies + origins) to MinIO. Returns the key."""
    _ensure_bucket()
    key = f"{session_id}.json"
    payload = json.dumps(storage_state).encode()
    minio_client.put_object(
        _BUCKET, key, io.BytesIO(payload), len(payload), content_type="application/json"
    )
    return key


def load_browser_session(session_id: str) -> dict | None:
    """Retrieve stored Playwright storage_state from MinIO, or None if not found."""
    _ensure_bucket()
    try:
        response = minio_client.get_object(_BUCKET, f"{session_id}.json")
        return json.loads(response.read())
    except Exception:
        return None
