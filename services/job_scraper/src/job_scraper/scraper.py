import asyncio

from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext

def scrapePage():
    crawler = PlaywrightCrawler(
        max_requests_per_crawl=1,  # Limit the max requests per crawl.
        headless=True,  # Run in headless mode (set to False to see the browser).
        browser_type='firefox',  # Use Firefox browser.
    )