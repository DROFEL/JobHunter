from typing import Optional
from urllib.parse import parse_qs, urlencode, urlparse

from bs4 import BeautifulSoup
from crawlee import Request
from crawlee.crawlers import PlaywrightCrawler

from job_scraper.scrapers.base_scraper import BaseScraper
from job_scraper.scrapers.html_cache import load_html, save_html
from job_scraper.scrapers.models import FetchedPage

_BASE_URL = "https://www.linkedin.com"


class LinkedInScraper(BaseScraper):
    def __init__(self, proxy: str):
        super().__init__(proxy)

    async def scrape_job_page(self, url: str) -> Optional[FetchedPage]:
        """Fetch a single LinkedIn job page unauthenticated."""
        cached = load_html(url)
        if cached:
            return FetchedPage(url=url, html=cached)

        result: dict = {"page": None}
        crawler = self._make_crawler(headless=True)

        @crawler.router.default_handler
        async def handler(context) -> None:
            if any(kw in context.page.url for kw in ("signup", "authwall")):
                return
            await context.page.wait_for_load_state("domcontentloaded")
            html = await context.page.content()
            save_html(url, html)
            result["page"] = FetchedPage(url=url, html=html)

        await crawler.run([url])
        return result["page"]

    async def scrape(
        self,
        url: str,
        results_wanted: int = 25,
        fetch_description: bool = False,
    ) -> list[FetchedPage]:
        crawler = self._make_crawler(headless=True)
        return await self._run_search_crawl(crawler, url, results_wanted, fetch_description)

    async def _run_search_crawl(
        self,
        crawler: PlaywrightCrawler,
        search_url: str,
        results_wanted: int,
        fetch_description: bool,
    ) -> list[FetchedPage]:
        pages: list[FetchedPage] = []
        seen_ids: set[str] = set()

        base_params = {k: v[0] for k, v in parse_qs(urlparse(search_url).query).items()}
        base_params.pop("start", None)

        def _guest_api_url(start: int) -> str:
            return (
                f"{_BASE_URL}/jobs-guest/jobs/api/seeMoreJobPostings/search?"
                + urlencode({**base_params, "start": start, "pageNum": 0})
            )

        @crawler.router.handler("SEARCH")
        async def search_handler(context) -> None:
            await context.page.wait_for_load_state("domcontentloaded")
            html = await context.page.content()
            save_html(context.request.url, html)

            soup = BeautifulSoup(html, "html.parser")
            job_cards = soup.find_all("div", class_="base-search-card")
            if not job_cards:
                return

            current_start = int(
                parse_qs(urlparse(context.request.url).query).get("start", ["0"])[0]
            )

            if not fetch_description:
                pages.append(FetchedPage(url=context.request.url, html=html))

            for card in job_cards:
                if len(seen_ids) >= results_wanted:
                    break
                href_tag = card.find("a", class_="base-card__full-link")
                if not (href_tag and "href" in href_tag.attrs):
                    continue
                job_id = href_tag.attrs["href"].split("?")[0].split("-")[-1]
                if job_id in seen_ids:
                    continue
                seen_ids.add(job_id)
                if fetch_description:
                    await context.add_requests([
                        Request.from_url(
                            f"{_BASE_URL}/jobs/view/{job_id}",
                            label="JOB_DETAIL",
                            always_enqueue=True,
                        )
                    ])

            if len(seen_ids) < results_wanted and len(job_cards) >= 25:
                next_start = current_start + len(job_cards)
                if next_start < 1000:
                    await context.add_requests([
                        Request.from_url(
                            _guest_api_url(next_start), label="SEARCH", always_enqueue=True
                        )
                    ])

        @crawler.router.handler("JOB_DETAIL")
        async def detail_handler(context) -> None:
            if any(kw in context.page.url for kw in ("signup", "authwall", "login")):
                return
            if len(pages) >= results_wanted:
                return
            cached = load_html(context.request.url)
            if cached is None:
                await context.page.wait_for_load_state("domcontentloaded")
                cached = await context.page.content()
                save_html(context.request.url, cached)
            pages.append(FetchedPage(url=context.request.url, html=cached))

        await crawler.run([Request.from_url(_guest_api_url(0), label="SEARCH")])
        return pages[:results_wanted]
