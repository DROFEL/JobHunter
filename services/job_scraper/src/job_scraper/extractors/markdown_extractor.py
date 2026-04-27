from crawl4ai import DefaultMarkdownGenerator, PruningContentFilter

_generator = DefaultMarkdownGenerator(
    content_filter=PruningContentFilter(),
    content_source="raw_html",
)


def to_markdown(html: str, base_url: str | None = None) -> str:
    if not html:
        return ""
    result = _generator.generate_markdown(input_html=html, base_url=base_url or "", citations=False)
    return (result.fit_markdown or result.raw_markdown or "").strip()
