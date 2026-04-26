import io
from urllib.parse import urlparse, parse_qs, urlencode

from common.minio import client as minio_client

_BUCKET = "posting-artifacts"

# Per-domain whitelist: only these query params are kept when the URL matches the domain.
# Everything else (tracking, session, etc.) is stripped so the same posting maps to one cache key.
_ALLOWED_QUERY_PARAMS: dict[str, set[str]] = {
    "linkedin.com": {"currentJobId"},
}

# Cross-domain identifiers: if any of these params are present, they uniquely identify the posting
# regardless of host (e.g. Ashby-hosted boards embedded on many company sites).
_IDENTIFYING_QUERY_PARAMS: set[str] = {"ashby_jid"}


def _key(url: str) -> str:
    p = urlparse(url)

    # Normalize host so `www.linkedin.com`, `linkedin.com`, and subdomains all hit the same rule.
    host = p.netloc.lower().removeprefix("www.")
    allowed = next(
        (params for domain, params in _ALLOWED_QUERY_PARAMS.items() if host == domain or host.endswith("." + domain)),
        None,
    )

    params = parse_qs(p.query)
    identifying = _IDENTIFYING_QUERY_PARAMS & params.keys()
    if identifying:
        # Identifier wins: strip everything else, including any domain-allowed params.
        kept = {k: params[k][0] for k in identifying}
    elif allowed is None:
        # Unknown host: keep all params as-is to avoid collapsing distinct pages into one key.
        kept = {k: v[0] for k, v in params.items()}
    else:
        kept = {k: params[k][0] for k in allowed if k in params}

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
