import re

from bs4 import BeautifulSoup, Comment


def extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(["script", "style", "noscript", "iframe", "svg", "canvas", "code", "pre", "template"]):
        tag.decompose()

    for c in soup.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()

    for tag in list(soup.find_all(True)):
        s = tag.get_text(" ", strip=True)
        if (
            (s.startswith("{") and '"data"' in s) or
            (s.startswith("{") and '"entityUrn"' in s) or
            (s.startswith("[") and s.endswith("]"))
        ):
            tag.decompose()

    return re.sub(r"\s+", " ", soup.get_text(separator=" ", strip=True)).strip()
