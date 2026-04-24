import asyncio
import json

from confluent_kafka import Consumer

from common.logging_config import get_logger, setup_logging
from db import Base, engine
from job_scraper.process_request import process_scrape_request
from job_scraper.search_worker import handle_search


KAFKA_BOOTSTRAP = "localhost:9094"


def _make_consumer(group_id: str) -> Consumer:
    return Consumer({
        "bootstrap.servers": KAFKA_BOOTSTRAP,
        "group.id": group_id,
        "auto.offset.reset": "earliest",
    })


async def _run_scrape_consumer() -> None:
    logger = get_logger(__name__)
    c = _make_consumer("worker-group")
    c.subscribe(["postings.scrape"])
    loop = asyncio.get_event_loop()
    try:
        while True:
            msg = await loop.run_in_executor(None, lambda: c.poll(1.0))
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error (postings.scrape): {msg.error()}")
                continue

            posting_id = msg.key().decode("utf-8")
            raw_value = msg.value().decode("utf-8")
            try:
                payload = json.loads(raw_value)
                posting_url = payload["url"]
                attempt = int(payload.get("attempt", 0))
            except (json.JSONDecodeError, KeyError, TypeError):
                # backwards-compat: old messages were raw URL strings
                posting_url = raw_value
                attempt = 0

            logger.info(f"Received scrape job posting_id={posting_id} url={posting_url} attempt={attempt}")
            try:
                await process_scrape_request(url=posting_url, posting_id=posting_id, attempt=attempt)
            except Exception:
                logger.exception(f"Unhandled error for posting_id={posting_id} at {posting_url}")
    except asyncio.CancelledError:
        logger.info("Graceful shutdown (postings.scrape)")
    finally:
        c.close()


async def _run_search_consumer() -> None:
    logger = get_logger(__name__)
    c = _make_consumer("search-worker-group")
    c.subscribe(["searches.discover"])
    loop = asyncio.get_event_loop()
    try:
        while True:
            msg = await loop.run_in_executor(None, lambda: c.poll(1.0))
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error (searches.discover): {msg.error()}")
                continue

            try:
                payload = json.loads(msg.value().decode("utf-8"))
            except json.JSONDecodeError:
                logger.exception("Invalid JSON on searches.discover")
                continue

            try:
                await handle_search(payload)
            except Exception:
                logger.exception(f"Search discovery failed for payload={payload}")
    except asyncio.CancelledError:
        logger.info("Graceful shutdown (searches.discover)")
    finally:
        c.close()


async def async_main():
    Base.metadata.create_all(bind=engine)
    setup_logging()
    await asyncio.gather(_run_scrape_consumer(), _run_search_consumer())


if __name__ == "__main__":
    asyncio.run(async_main())
