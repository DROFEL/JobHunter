from datetime import timedelta

from job_scraper.scrapers.linkedin_scraper import LinkedInScraper
from job_scraper.scrapers.models import FetchedPage
from job_scraper.scrapers.session_store import load_session, save_session

_LINKEDIN_BASE = "https://www.linkedin.com"


class LinkedInAuthenticatedScraper(LinkedInScraper):
    def __init__(self, proxy: str, username: str, password: str):
        super().__init__(proxy)
        self.username = username
        self.password = password

    async def scrape(self, url: str) -> list[FetchedPage]:  # type: ignore[override]
        storage_state = await self._ensure_session()
        crawler = self._make_crawler(headless=True, storage_state=storage_state)
        return await self._scrape_single_page(crawler, url)

    async def get_apply_url(self, url: str) -> str | None:
        """Click the offsite apply button and return the URL of the external page."""
        storage_state = await self._ensure_session()
        result: dict = {"url": None}
        crawler = self._make_crawler(headless=True, storage_state=storage_state, max_requests=1)

        @crawler.router.default_handler
        async def handler(context) -> None:
            if any(kw in context.page.url for kw in ("signup", "authwall", "login")):
                return
            await context.page.wait_for_load_state("domcontentloaded")
            btn = context.page.locator("div.jobs-apply-button--top-card button")
            if await btn.count() == 0:
                return
            try:
                async with context.page.context.expect_page(timeout=5_000) as new_page_info:
                    await btn.click()
                new_page = await new_page_info.value
                await new_page.wait_for_load_state("domcontentloaded")
                result["url"] = new_page.url
            except Exception:
                await context.page.wait_for_load_state("networkidle")
                if context.page.url != url:
                    result["url"] = context.page.url

        await crawler.run([url])
        return result["url"]

    async def _scrape_single_page(self, crawler, url: str) -> list[FetchedPage]:
        result: list[FetchedPage] = []

        @crawler.router.default_handler
        async def handler(context) -> None:
            if any(kw in context.page.url for kw in ("signup", "authwall", "login")):
                return
            await context.page.wait_for_load_state("domcontentloaded")
            result.append(FetchedPage(url=url, html=await context.page.content()))

        await crawler.run([url])
        return result

    async def _ensure_session(self) -> dict:
        storage_state = load_session(self.username)
        if storage_state and await self._check_auth(storage_state):
            return storage_state
        storage_state = await self._authenticate()
        save_session(self.username, storage_state)
        return storage_state

    async def _check_auth(self, storage_state: dict) -> bool:
        is_authed = {"value": False}
        crawler = self._make_crawler(headless=True, storage_state=storage_state, max_requests=1)

        @crawler.router.default_handler
        async def handler(context) -> None:
            await context.page.wait_for_load_state("domcontentloaded")
            is_authed["value"] = not any(
                kw in context.page.url for kw in ("login", "authwall", "signup", "checkpoint")
            )

        await crawler.run([f"{_LINKEDIN_BASE}/feed"])
        return is_authed["value"]

    async def _authenticate(self) -> dict:
        """Open a headed browser and wait for the user to complete login + MFA."""
        storage_state: dict = {}
        crawler = self._make_crawler(
            headless=False,
            request_handler_timeout=timedelta(minutes=10),
        )

        @crawler.router.default_handler
        async def handler(context) -> None:
            await context.page.wait_for_url(
                f"{_LINKEDIN_BASE}/feed**",
                timeout=600_000,
            )
            storage_state.update(await context.page.context.storage_state())

        await crawler.run([f"{_LINKEDIN_BASE}/login"])
        return storage_state
