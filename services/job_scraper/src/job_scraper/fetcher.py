import logging
import os
from dataclasses import dataclass, field

from crawlee.crawlers import PlaywrightCrawler
from crawlee.storage_clients import MemoryStorageClient

from common.logging_config import setup_logging
from job_scraper.extractors.generic_extractor import extract_text
from job_scraper.scrapers.models import FetchedPage, ScrapedJob


@dataclass
class FetchResult:
    llm_text: str
    pre_extracted: ScrapedJob | None = field(default=None)


async def fetch_page(url: str) -> FetchResult:
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.lower().removeprefix("www.")

    match domain:
        case "linkedin.com":
            return await _fetch_linkedin(url)
        case _:
            return await _fetch_generic(url)


async def _fetch_generic(url: str) -> FetchResult:
    result = {"html": "", "frame_htmls": []}

    crawler = PlaywrightCrawler(storage_client=MemoryStorageClient(), headless=False)

    @crawler.router.default_handler
    async def handler(context):
        page = context.page
        try:
            await page.wait_for_load_state("networkidle", timeout=10000)
        except Exception:
            await page.wait_for_load_state("load")
        result["html"] = await page.content()
        for frame in page.frames[1:]:
            try:
                result["frame_htmls"].append(await frame.content())
            except Exception:
                pass

    level = logging.getLogger().level
    await crawler.run([url])
    setup_logging(level)

    parts = [extract_text(result["html"])]
    for frame_html in result["frame_htmls"]:
        cleaned = extract_text(frame_html)
        if cleaned.strip():
            parts.append(cleaned)

    return FetchResult(llm_text="\n".join(parts))


async def _fetch_linkedin(url: str) -> FetchResult:
    from job_scraper.scrapers.linkedin_authenticated_scraper import LinkedInAuthenticatedScraper
    from job_scraper.extractors.linkedin_extractor import extract
    from job_scraper.scrapers.html_cache import load_html, save_html
    from job_scraper.scrapers.linkedin_scraper import LinkedInScraper

    proxy = os.environ.get("LINKEDIN_PROXY", "")
    username = os.environ.get("LINKEDIN_USERNAME", "")
    password = os.environ.get("LINKEDIN_PASSWORD", "")

    cached_html = load_html(url)
    if cached_html:
        page = FetchedPage(url=url, html=cached_html)
    else:
        page = await LinkedInScraper(proxy=proxy).scrape_job_page(url)
        if page is None:
            return FetchResult(llm_text="")
        save_html(url, page.html)

    jobs = extract(page)
    if not jobs:
        return FetchResult(llm_text="")
    job = jobs[0]

    if not job.external_application or not all((proxy, username, password)):
        return FetchResult(pre_extracted=job, llm_text=_job_to_llm_text(job))

    apply_url = await LinkedInAuthenticatedScraper(proxy, username, password).get_apply_url(url)
    if not apply_url:
        return FetchResult(pre_extracted=job, llm_text=_job_to_llm_text(job))

    offsite = await _fetch_generic(apply_url)
    return FetchResult(pre_extracted=job, llm_text=offsite.llm_text)


def _job_to_llm_text(job: ScrapedJob) -> str:
    parts = []
    if job.title and job.title != "N/A":
        parts.append(f"Title: {job.title}")
    if job.company and job.company != "N/A":
        parts.append(f"Company: {job.company}")
    if job.location:
        parts.append(f"Location: {job.location}")
    if job.job_type:
        parts.append(f"Employment type: {job.job_type}")
    if job.job_level:
        parts.append(f"Seniority: {job.job_level}")
    if job.salary:
        parts.append(f"Salary: {job.salary}")
    if job.description:
        parts.append(f"\n{job.description}")
    return "\n".join(parts)
