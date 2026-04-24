from dataclasses import dataclass
from urllib.parse import parse_qs, urlencode, urlparse

import requests
from bs4 import BeautifulSoup

_BASE_URL = "https://www.linkedin.com"
_PAGE_SIZE = 25
_MAX_START = 1000
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
}


@dataclass
class DiscoveredPosting:
    url: str
    board_id: str
    title: str | None
    company: str | None


def _guest_api_url(search_url: str, start: int) -> str:
    base_params = {k: v[0] for k, v in parse_qs(urlparse(search_url).query).items()}
    base_params.pop("start", None)
    return (
        f"{_BASE_URL}/jobs-guest/jobs/api/seeMoreJobPostings/search?"
        + urlencode({**base_params, "start": start, "pageNum": 0})
    )


def _text_or_none(el) -> str | None:
    if el is None:
        return None
    t = el.get_text(strip=True)
    return t or None


def parse_cards(html: str) -> list[DiscoveredPosting]:
    soup = BeautifulSoup(html, "html.parser")
    out: list[DiscoveredPosting] = []
    for card in soup.find_all("div", class_="base-search-card"):
        href_tag = card.find("a", class_="base-card__full-link")
        if not (href_tag and "href" in href_tag.attrs):
            continue
        href = href_tag.attrs["href"]
        board_id = href.split("?")[0].split("-")[-1]
        if not board_id:
            continue
        url = f"{_BASE_URL}/jobs/view/{board_id}"
        title = _text_or_none(card.find("h3", class_="base-search-card__title"))
        company = _text_or_none(card.find("h4", class_="base-search-card__subtitle"))
        out.append(DiscoveredPosting(url=url, board_id=board_id, title=title, company=company))
    return out


def fetch(search_url: str, results_wanted: int = _PAGE_SIZE) -> list[DiscoveredPosting]:
    seen: set[str] = set()
    results: list[DiscoveredPosting] = []
    start = 0
    while start < _MAX_START and len(results) < results_wanted:
        resp = requests.get(_guest_api_url(search_url, start), headers=_HEADERS, timeout=15)
        resp.raise_for_status()
        cards = parse_cards(resp.text)
        if not cards:
            break
        for p in cards:
            if p.board_id in seen:
                continue
            seen.add(p.board_id)
            results.append(p)
            if len(results) >= results_wanted:
                break
        if len(cards) < _PAGE_SIZE:
            break
        start += len(cards)
    return results[:results_wanted]
