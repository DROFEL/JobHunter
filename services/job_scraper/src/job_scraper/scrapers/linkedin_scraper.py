from job_scraper.scrapers import browser
from job_scraper.scrapers.models import FetchedPage


async def scrape_job_page(url: str) -> FetchedPage | None:
    """Fetch a single LinkedIn job page unauthenticated via camoufox."""
    html = await browser.fetch_html(url, wait="domcontentloaded")
    if html is None:
        return None
    return FetchedPage(url=url, html=html)
