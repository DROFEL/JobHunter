import json
import os
import re

from bs4 import BeautifulSoup, Comment
from crawlee.crawlers import PlaywrightCrawler
from crawlee.storage_clients import MemoryStorageClient

from common.logging_config import setup_logging


def clean_html_for_llm(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    # Remove obvious non-content tags entirely
    for tag in soup.find_all([
        "script", "style", "noscript", "iframe", "svg", "canvas",
        "code", "pre", "template"
    ]):
        tag.decompose()

    # Remove comments
    for c in soup.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()

    # Remove elements that are probably raw JSON blobs
    for tag in list(soup.find_all(True)):
        text = tag.get_text(" ", strip=True)
        s = text.strip()
        if (
            (s.startswith("{") and '"data"' in s) or
            (s.startswith("{") and '"entityUrn"' in s) or
            (s.startswith("[") and s.endswith("]"))
        ):
            tag.decompose()

    # Keep only tags that carry useful URLs/sources
    def should_keep_tag(tag) -> bool:
        if tag.name == "a" and tag.get("href"):
            return True
        if tag.name in {"img", "source", "video", "audio"} and tag.get("src"):
            return True
        return False

    # Strip attributes from kept tags, except the URL-carrying ones
    for tag in soup.find_all(True):
        if tag.name == "a" and tag.get("href"):
            tag.attrs = {"href": tag.get("href")}
        elif tag.name in {"img", "source", "video", "audio"} and tag.get("src"):
            tag.attrs = {"src": tag.get("src")}
        else:
            tag.attrs = {}

    # Remove all tags except URL/source-carrying ones, but keep their text
    for tag in list(soup.find_all(True)):
        if should_keep_tag(tag):
            continue
        if tag.name in {"html", "body"}:
            continue
        tag.unwrap()

    body = soup.body
    html_out = "".join(str(child) for child in body.contents) if body else str(soup)

    # Normalize whitespace without gluing words together
    html_out = re.sub(r"\s+", " ", html_out).strip()

    return html_out


async def fetch_and_clean(url: str) -> str:
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.lower().removeprefix("www.")

    match domain:
        case "linkedin.com":
            return await _fetch_linkedin(url)
        case _:
            return await _fetch_generic(url)


async def _fetch_generic(url: str) -> str:
    result = {"html": ""}

    crawler = PlaywrightCrawler(storage_client=MemoryStorageClient())

    @crawler.router.default_handler
    async def handler(context):
        page = context.page
        await page.wait_for_load_state("networkidle")
        result["html"] = await page.content()

    await crawler.run([url])
    setup_logging()
    return result["html"]


async def _fetch_linkedin(url: str) -> str:
    from job_scraper.scrapers.linkedin_authenticated_scraper import LinkedInAuthenticatedScraper
    from job_scraper.extractors.linkedin_extractor import extract
    from job_scraper.scrapers.linkedin_scraper import LinkedInScraper

    proxy = os.environ.get("LINKEDIN_PROXY", "")
    username = os.environ.get("LINKEDIN_USERNAME", "")
    password = os.environ.get("LINKEDIN_PASSWORD", "")

    # Phase 1: unauthenticated fetch
    page = await LinkedInScraper(proxy=proxy).scrape_job_page(url)
    if page is None:
        return ""

    jobs = extract(page)
    if not jobs:
        return ""
    job = jobs[0]

    if not job.external_application:
        return json.dumps(job.model_dump(mode="json"), indent=2)

    # Phase 2: offsite — authenticated click to capture the redirect URL
    if not all((proxy, username, password)):
        return json.dumps(job.model_dump(mode="json"), indent=2)

    apply_url = await LinkedInAuthenticatedScraper(proxy, username, password).get_apply_url(url)
    return apply_url or json.dumps(job.model_dump(mode="json"), indent=2)
