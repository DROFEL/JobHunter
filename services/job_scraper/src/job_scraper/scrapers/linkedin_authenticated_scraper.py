from job_scraper.scrapers import browser
from job_scraper.scrapers.session_store import load_session, save_session

_LINKEDIN_BASE = "https://www.linkedin.com"
_AUTHWALL_KEYWORDS = ("login", "authwall", "signup", "checkpoint")


class LinkedInAuthenticatedScraper:
    def __init__(self, username: str, password: str):
        self.username = username
        self.password = password

    async def get_apply_url(self, url: str) -> str | None:
        """Click the offsite apply button and return the URL of the external page."""
        storage_state = await self._ensure_session()
        async with browser.new_page(storage_state=storage_state) as page:
            await page.goto(url, wait_until="domcontentloaded")
            if any(kw in page.url for kw in _AUTHWALL_KEYWORDS):
                return None
            btn = page.locator("div.jobs-apply-button--top-card button")
            if await btn.count() == 0:
                return None
            try:
                async with page.context.expect_page(timeout=5_000) as new_page_info:
                    await btn.click()
                new_page = await new_page_info.value
                await new_page.wait_for_load_state("domcontentloaded")
                return new_page.url
            except Exception:
                await page.wait_for_load_state("networkidle")
                return page.url if page.url != url else None

    async def _ensure_session(self) -> dict:
        storage_state = load_session(self.username)
        if storage_state and await self._check_auth(storage_state):
            return storage_state
        storage_state = await self._authenticate()
        save_session(self.username, storage_state)
        return storage_state

    async def _check_auth(self, storage_state: dict) -> bool:
        async with browser.new_page(storage_state=storage_state) as page:
            await page.goto(f"{_LINKEDIN_BASE}/feed", wait_until="domcontentloaded")
            return not any(kw in page.url for kw in _AUTHWALL_KEYWORDS)

    async def _authenticate(self) -> dict:
        """Open a headed browser and wait for the user to complete login + MFA."""
        async with browser.new_page(headless=False) as page:
            await page.goto(f"{_LINKEDIN_BASE}/login")
            await page.wait_for_url(f"{_LINKEDIN_BASE}/feed**", timeout=600_000)
            return await page.context.storage_state()
