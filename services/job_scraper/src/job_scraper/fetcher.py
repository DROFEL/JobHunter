import random
from dataclasses import dataclass, field

from common.config import get_settings
from job_scraper.extractors.markdown_extractor import to_markdown
from job_scraper.scrapers import browser
from job_scraper.scrapers.models import FetchedPage, ScrapedJob


@dataclass
class FetchResult:
    llm_text: str
    pre_extracted: ScrapedJob | None = field(default=None)


def _pick_linkedin_account() -> tuple[str, str]:
    accounts = get_settings().linkedin_accounts
    if not accounts:
        return "", ""
    account = random.choice(accounts)
    return account.get("email", ""), account.get("password", "")


async def fetch_page(url: str) -> FetchResult:
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.lower().removeprefix("www.")

    match domain:
        case "linkedin.com":
            return await _fetch_linkedin(url)
        case _:
            return await _fetch_generic(url)


async def _fetch_generic(url: str) -> FetchResult:
    parts: list[str] = []

    async with browser.new_page(headless=False) as page:
        try:
            await page.goto(url, wait_until="networkidle", timeout=10_000)
        except Exception:
            await page.goto(url, wait_until="load", timeout=30_000)

        main_html = await page.content()
        parts.append(to_markdown(main_html, base_url=page.url))

        for frame in page.frames[1:]:
            try:
                frame_html = await frame.content()
            except Exception:
                continue
            cleaned = to_markdown(frame_html, base_url=frame.url)
            if cleaned.strip():
                parts.append(cleaned)

    return FetchResult(llm_text="\n".join(p for p in parts if p))


async def _fetch_linkedin(url: str) -> FetchResult:
    from job_scraper.scrapers.linkedin_authenticated_scraper import LinkedInAuthenticatedScraper
    from job_scraper.extractors.linkedin_extractor import extract
    from job_scraper.scrapers.html_cache import load_html, save_html
    from job_scraper.scrapers.linkedin_scraper import scrape_job_page

    proxy = get_settings().proxy
    username, password = _pick_linkedin_account()

    cached_html = load_html(url)
    if cached_html:
        page = FetchedPage(url=url, html=cached_html)
    else:
        page = await scrape_job_page(url)
        if page is None:
            return FetchResult(llm_text="")
        save_html(url, page.html)

    jobs = extract(page)
    if not jobs:
        return FetchResult(llm_text="")
    job = jobs[0]

    if not job.external_application or not all((proxy, username, password)):
        return FetchResult(pre_extracted=job, llm_text=_job_to_llm_text(job))

    apply_url = await LinkedInAuthenticatedScraper(username, password).get_apply_url(url)
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
