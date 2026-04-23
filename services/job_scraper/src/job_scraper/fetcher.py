import os
import re
from dataclasses import dataclass, field

from bs4 import BeautifulSoup, Comment
from crawlee.crawlers import PlaywrightCrawler
from crawlee.storage_clients import MemoryStorageClient

from common.logging_config import setup_logging
from job_scraper.scrapers.models import FetchedPage, ScrapedJob


@dataclass
class FetchResult:
    llm_text: str
    pre_extracted: ScrapedJob | None = field(default=None)


def clean_html_for_llm(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all([
        "script", "style", "noscript", "iframe", "svg", "canvas",
        "code", "pre", "template"
    ]):
        tag.decompose()

    for c in soup.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()

    for tag in list(soup.find_all(True)):
        text = tag.get_text(" ", strip=True)
        s = text.strip()
        if (
            (s.startswith("{") and '"data"' in s) or
            (s.startswith("{") and '"entityUrn"' in s) or
            (s.startswith("[") and s.endswith("]"))
        ):
            tag.decompose()

    def should_keep_tag(tag) -> bool:
        if tag.name == "a" and tag.get("href"):
            return True
        if tag.name in {"img", "source", "video", "audio"} and tag.get("src"):
            return True
        return False

    for tag in soup.find_all(True):
        if tag.name == "a" and tag.get("href"):
            tag.attrs = {"href": tag.get("href")}
        elif tag.name in {"img", "source", "video", "audio"} and tag.get("src"):
            tag.attrs = {"src": tag.get("src")}
        else:
            tag.attrs = {}

    for tag in list(soup.find_all(True)):
        if should_keep_tag(tag):
            continue
        if tag.name in {"html", "body"}:
            continue
        tag.unwrap()

    body = soup.body
    html_out = "".join(str(child) for child in body.contents) if body else str(soup)
    html_out = re.sub(r"\s+", " ", html_out).strip()
    return html_out


async def fetch_page(url: str) -> FetchResult:
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.lower().removeprefix("www.")

    match domain:
        case "linkedin.com":
            return await _fetch_linkedin(url)
        case _:
            return await _fetch_generic(url)


async def _fetch_generic(url: str) -> FetchResult:
    result = {"html": ""}

    crawler = PlaywrightCrawler(storage_client=MemoryStorageClient())

    @crawler.router.default_handler
    async def handler(context):
        page = context.page
        await page.wait_for_load_state("networkidle")
        result["html"] = await page.content()

    await crawler.run([url])
    setup_logging()
    return FetchResult(llm_text=clean_html_for_llm(result["html"]))


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
