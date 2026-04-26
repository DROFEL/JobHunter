from minio import Minio

from common.config import get_settings

_s = get_settings()
client = Minio(
    _s.minio_endpoint,
    access_key=_s.minio_root_user,
    secret_key=_s.minio_root_password,
    secure=False,
)