import re
from datetime import datetime
from typing import Optional
from urllib.parse import unquote, urlparse, urlunparse

from bs4 import BeautifulSoup
from bs4.element import Tag

from job_scraper.scrapers.models import FetchedPage, ScrapedJob

_BASE_URL = "https://www.linkedin.com"
_REMOTE_KEYWORDS = {"remote", "work from home", "wfh"}
_JOB_URL_DIRECT_RE = re.compile(r'(?<=\?url=)[^"]+')


def extract(page: FetchedPage) -> list[ScrapedJob]:
    """Dispatch to the right parser based on URL pattern."""
    if "/jobs/view/" in page.url:
        job = _extract_detail_page(page)
        return [job] if job else []
    if "seeMoreJobPostings" in page.url or "jobs-guest" in page.url:
        return _extract_search_page(page)
    return []


# ---------------------------------------------------------------------------
# Detail page (single authenticated or unauthenticated job page)
# ---------------------------------------------------------------------------

def _extract_detail_page(page: FetchedPage) -> Optional[ScrapedJob]:
    job_id = page.url.rstrip("/").split("/")[-1]
    soup = BeautifulSoup(page.html, "html.parser")

    title_tag = (
        soup.find("h1", class_=lambda c: c and "job-title" in c)
        or soup.find("h1", class_=lambda c: c and "top-card-layout__title" in c)
    )
    title = title_tag.get_text(strip=True) if title_tag else "N/A"

    company_tag = (
        soup.find("a", class_=lambda c: c and "org-name" in c)
        or soup.find("a", class_=lambda c: c and "topcard__org-name-link" in c)
    )
    company = company_tag.get_text(strip=True) if company_tag else "N/A"
    company_url = company_tag.get("href", "").split("?")[0] if company_tag else None

    location_tag = soup.find("span", class_=lambda c: c and "topcard__flavor--bullet" in c)
    location = location_tag.get_text(strip=True) if location_tag else None

    details = _parse_job_details(soup)
    description = details.get("description") or ""

    logo_img = soup.find("img", {"class": "artdeco-entity-image"})
    company_logo = logo_img.get("data-delayed-url") if logo_img else None

    external_application = bool(soup.find(class_="apply-button__offsite-apply-icon-svg"))

    return ScrapedJob(
        id=f"li-{job_id}",
        title=title,
        company=company,
        company_url=company_url,
        company_logo=company_logo,
        company_industry=details.get("company_industry"),
        location=location,
        is_remote=_is_remote(title, description, location or ""),
        job_url=page.url,
        job_url_direct=details.get("job_url_direct"),
        job_type=details.get("job_type"),
        job_level=(details.get("job_level") or "").lower() or None,
        job_function=details.get("job_function"),
        description=description or None,
        external_application=external_application,
    )


# ---------------------------------------------------------------------------
# Search result page (guest API fragment with multiple job cards)
# ---------------------------------------------------------------------------

def _extract_search_page(page: FetchedPage) -> list[ScrapedJob]:
    soup = BeautifulSoup(page.html, "html.parser")
    jobs = []
    for card in soup.find_all("div", class_="base-search-card"):
        href_tag = card.find("a", class_="base-card__full-link")
        if not (href_tag and "href" in href_tag.attrs):
            continue
        job_id = href_tag.attrs["href"].split("?")[0].split("-")[-1]
        job = _parse_job_card(job_id, card)
        if job:
            jobs.append(job)
    return jobs


# ---------------------------------------------------------------------------
# Shared parsers
# ---------------------------------------------------------------------------

def _parse_job_card(job_id: str, card: Tag) -> Optional[ScrapedJob]:
    salary_tag = card.find("span", class_="job-search-card__salary-info")
    salary = salary_tag.get_text(separator=" ").strip() if salary_tag else None

    title_tag = card.find("span", class_="sr-only")
    title = title_tag.get_text(strip=True) if title_tag else "N/A"

    company_tag = card.find("h4", class_="base-search-card__subtitle")
    company_a = company_tag.find("a") if company_tag else None
    company_url = (
        urlunparse(urlparse(company_a.get("href"))._replace(query=""))
        if company_a and company_a.has_attr("href")
        else None
    )
    company = company_a.get_text(strip=True) if company_a else "N/A"

    metadata = card.find("div", class_="base-search-card__metadata")
    location = None
    date_posted = None
    if metadata:
        loc_tag = metadata.find("span", class_="job-search-card__location")
        location = loc_tag.get_text(strip=True) if loc_tag else None
        dt_tag = (
            metadata.find("time", class_="job-search-card__listdate")
            or metadata.find("time", class_="job-search-card__listdate--new")
        )
        if dt_tag and "datetime" in dt_tag.attrs:
            try:
                date_posted = datetime.strptime(dt_tag["datetime"], "%Y-%m-%d").date()
            except ValueError:
                pass

    return ScrapedJob(
        id=f"li-{job_id}",
        title=title,
        company=company,
        company_url=company_url,
        location=location,
        is_remote=_is_remote(title, "", location or ""),
        date_posted=date_posted,
        job_url=f"{_BASE_URL}/jobs/view/{job_id}",
        salary=salary,
    )


def _parse_job_details(soup: BeautifulSoup) -> dict:
    div_content = soup.find("div", class_=lambda x: x and "show-more-less-html__markup" in x)
    description = div_content.get_text(separator="\n", strip=True) if div_content else None

    job_function = None
    h3_func = soup.find("h3", string=lambda t: t and "Job function" in t.strip())
    if h3_func:
        span = h3_func.find_next("span", class_="description__job-criteria-text")
        if span:
            job_function = span.get_text(strip=True)

    logo_img = soup.find("img", {"class": "artdeco-entity-image"})
    company_logo = logo_img.get("data-delayed-url") if logo_img else None

    job_url_direct = None
    code_tag = soup.find("code", id="applyUrl")
    if code_tag:
        m = _JOB_URL_DIRECT_RE.search(code_tag.decode_contents().strip())
        if m:
            job_url_direct = unquote(m.group())

    return {
        "description": description,
        "job_level": _parse_criteria(soup, "Seniority level"),
        "company_industry": _parse_criteria(soup, "Industries"),
        "job_type": _parse_criteria(soup, "Employment type"),
        "job_url_direct": job_url_direct,
        "company_logo": company_logo,
        "job_function": job_function,
    }


def _parse_criteria(soup: BeautifulSoup, label: str) -> Optional[str]:
    h3 = soup.find(
        "h3",
        class_="description__job-criteria-subheader",
        string=lambda t: t and label in t,
    )
    if h3:
        span = h3.find_next_sibling(
            "span",
            class_="description__job-criteria-text description__job-criteria-text--criteria",
        )
        if span:
            return span.get_text(strip=True)
    return None


def _is_remote(title: str, description: str, location: str) -> bool:
    return any(kw in f"{title} {description} {location}".lower() for kw in _REMOTE_KEYWORDS)
