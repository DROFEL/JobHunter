import re
import asyncio
from bs4 import BeautifulSoup, Comment
from crawlee.crawlers import PlaywrightCrawler


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
    result = {"html": ""}

    crawler = PlaywrightCrawler()

    @crawler.router.default_handler
    async def handler(context):
        page = context.page
        await page.wait_for_load_state("networkidle")
        raw_html = await page.content()
        result["html"] = clean_html_for_llm(raw_html)

    await crawler.run([url])
    return result["html"]


if __name__ == "__main__":
    url = "https://www.linkedin.com/jobs/view/4404360495/"
    cleaned_html = asyncio.run(fetch_and_clean(url))

    with open("cleaned.html", "w", encoding="utf-8") as f:
        f.write(cleaned_html)

    print(cleaned_html[:2000])