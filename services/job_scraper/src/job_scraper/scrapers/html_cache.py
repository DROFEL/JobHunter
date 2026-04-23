import io
from urllib.parse import urlparse, parse_qs, urlencode

from common.minio import client as minio_client

_BUCKET = "posting-artifacts"


def _key(url: str) -> str:
    p = urlparse(url)

    params = parse_qs(p.query)
    kept = {}

    if "currentJobId" in params:
        kept["currentJobId"] = params["currentJobId"][0]

    query = urlencode(kept)

    base = f"{p.netloc}{p.path}".strip("/")
    return f"{base}?{query}" if query else base


def load_html(url: str) -> str | None:
    try:
        response = minio_client.get_object(_BUCKET, _key(url))
        return response.read().decode("utf-8")
    except Exception:
        return None


def save_html(url: str, html: str) -> None:
    payload = html.encode("utf-8")
    try:
        minio_client.put_object(
            _BUCKET,
            _key(url),
            io.BytesIO(payload),
            len(payload),
            content_type="text/html",
        )
    except Exception:
        pass
