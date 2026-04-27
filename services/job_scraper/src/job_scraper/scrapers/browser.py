import asyncio
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Optional
from urllib.parse import urlparse

from camoufox.async_api import AsyncCamoufox
from playwright.async_api import Browser, BrowserContext, Page

from common.config import get_settings
from common.logging_config import get_logger

_AUTHWALL_KEYWORDS = ("signup", "authwall", "login")


def _proxy_dict() -> Optional[dict[str, str]]:
    proxy = (get_settings().proxy or "").strip()
    if not proxy:
        return None
    if "://" not in proxy:
        proxy = f"http://{proxy}"
    parsed = urlparse(proxy)
    server = f"{parsed.scheme}://{parsed.hostname}"
    if parsed.port:
        server = f"{server}:{parsed.port}"
    out: dict[str, str] = {"server": server}
    if parsed.username:
        out["username"] = parsed.username
    if parsed.password:
        out["password"] = parsed.password
    return out


class _BrowserHolder:
    """Singleton holder for a long-lived headless camoufox browser."""

    def __init__(self) -> None:
        self._browser: Browser | None = None
        self._cm: AsyncCamoufox | None = None
        self._lock = asyncio.Lock()

    async def _get(self) -> Browser:
        if self._browser is not None:
            return self._browser
        async with self._lock:
            if self._browser is not None:
                return self._browser
            cm = AsyncCamoufox(headless=True, proxy=_proxy_dict(), humanize=True)
            browser = await cm.__aenter__()
            self._cm = cm
            self._browser = browser  # type: ignore[assignment]
            return self._browser  # type: ignore[return-value]

    async def aclose(self) -> None:
        async with self._lock:
            if self._cm is None:
                return
            try:
                await self._cm.__aexit__(None, None, None)
            except Exception:
                get_logger(__name__).exception("Error closing camoufox browser")
            finally:
                self._cm = None
                self._browser = None


_holder = _BrowserHolder()


def _is_blocked_url(url: str) -> bool:
    return any(kw in url for kw in _AUTHWALL_KEYWORDS)


@asynccontextmanager
async def new_page(
    *,
    storage_state: dict | None = None,
    headless: bool = True,
    extra_context_options: dict[str, Any] | None = None,
) -> AsyncIterator[Page]:
    """Yield a Playwright `Page` backed by a fresh isolated `BrowserContext`.

    `headless=True` reuses the shared browser; `headless=False` spawns a
    one-shot browser (auth flows, the legacy generic-fetch headed mode).
    """
    context_options: dict[str, Any] = dict(extra_context_options or {})
    if storage_state is not None:
        context_options["storage_state"] = storage_state

    if headless:
        browser = await _holder._get()
        context = await browser.new_context(**context_options)
        try:
            page = await context.new_page()
            try:
                yield page
            finally:
                await page.close()
        finally:
            await context.close()
        return

    async with AsyncCamoufox(headless=False, proxy=_proxy_dict(), humanize=True) as browser:  # type: ignore[arg-type]
        context: BrowserContext = await browser.new_context(**context_options)  # type: ignore[union-attr]
        try:
            page = await context.new_page()
            try:
                yield page
            finally:
                await page.close()
        finally:
            await context.close()


async def fetch_html(
    url: str,
    *,
    storage_state: dict | None = None,
    wait: str = "domcontentloaded",
    timeout_ms: int = 30_000,
    headless: bool = True,
) -> str | None:
    """Navigate to `url` and return the final HTML.

    Returns `None` if the final URL hits a LinkedIn auth/signup gate
    (mirrors the existing skip behaviour in the legacy scrapers).
    """
    async with new_page(storage_state=storage_state, headless=headless) as page:
        await page.goto(url, wait_until=wait, timeout=timeout_ms)  # type: ignore[arg-type]
        if _is_blocked_url(page.url):
            return None
        return await page.content()


async def aclose() -> None:
    await _holder.aclose()
