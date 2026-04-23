import hashlib
import io
import json
from datetime import datetime, timedelta, timezone

from common.minio import client as minio_client

_BUCKET = "linkedin-sessions"
_MAX_AGE = timedelta(hours=168)  # 7 days


def _key(username: str) -> str:
    return hashlib.sha256(username.encode()).hexdigest() + ".json"


def _ensure_bucket() -> None:
    if not minio_client.bucket_exists(_BUCKET):
        minio_client.make_bucket(_BUCKET)


def load_session(username: str) -> dict | None:
    """Return cached Playwright storage_state or None if missing/expired."""
    _ensure_bucket()
    try:
        response = minio_client.get_object(_BUCKET, _key(username))
        data = json.loads(response.read())
    except Exception:
        return None
    saved_at = datetime.fromisoformat(data["saved_at"])
    if datetime.now(timezone.utc) - saved_at > _MAX_AGE:
        return None
    return data["storage_state"]


def save_session(username: str, storage_state: dict) -> None:
    """Persist Playwright storage_state (cookies + origins) to MinIO."""
    _ensure_bucket()
    payload = json.dumps(
        {"storage_state": storage_state, "saved_at": datetime.now(timezone.utc).isoformat()}
    ).encode()
    minio_client.put_object(
        _BUCKET,
        _key(username),
        io.BytesIO(payload),
        len(payload),
        content_type="application/json",
    )
