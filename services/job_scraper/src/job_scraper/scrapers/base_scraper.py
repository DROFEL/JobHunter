from abc import ABC, abstractmethod
from datetime import timedelta

from crawlee.crawlers import PlaywrightCrawler
from crawlee.proxy_configuration import ProxyConfiguration
from crawlee.storage_clients import MemoryStorageClient

from job_scraper.scrapers.models import FetchedPage


class BaseScraper(ABC):
    def __init__(self, proxy: str):
        self.proxy = proxy

    def _make_crawler(
        self,
        headless: bool = True,
        storage_state: dict | None = None,
        request_handler_timeout: timedelta = timedelta(minutes=2),
        max_requests: int | None = None,
    ) -> PlaywrightCrawler:
        context_options: dict = {}
        if storage_state:
            context_options["storage_state"] = storage_state
        proxy_config = ProxyConfiguration(proxy_urls=[self.proxy]) if self.proxy else None
        return PlaywrightCrawler(
            headless=headless,
            proxy_configuration=proxy_config,
            browser_new_context_options=context_options or None,
            storage_client=MemoryStorageClient(),
            request_handler_timeout=request_handler_timeout,
            max_requests_per_crawl=max_requests,
        )

    @abstractmethod
    async def scrape(self, url: str) -> list[FetchedPage]:
        pass
