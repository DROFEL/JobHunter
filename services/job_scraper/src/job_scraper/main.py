import asyncio
from job_scraper.process_request import process_scrape_request
from db import Base, engine
from confluent_kafka import Consumer
from common.logging_config import setup_logging, get_logger

async def async_main():
    Base.metadata.create_all(bind=engine)
    setup_logging()
    logger = get_logger(__name__)

    c = Consumer({
        "bootstrap.servers": "localhost:9094",
        "group.id": "worker-group",
        "auto.offset.reset": "earliest",
    })
    c.subscribe(["scrape_jobs"])

    loop = asyncio.get_event_loop()

    try:
        while True:
            msg = await loop.run_in_executor(None, lambda: c.poll(1.0))
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error: {msg.error()}")
                continue

            posting_id = msg.key().decode("utf-8")
            posting_url = msg.value().decode("utf-8")
            logger.info(f"Received job with posting_id {posting_id} and url {posting_url}")

            try:
                await process_scrape_request(url=posting_url, posting_id=posting_id)
            except Exception:
                logger.exception(f"Failed job for posting_id {posting_id} at {posting_url}")
    except asyncio.CancelledError:
        logger.info("Graceful shutdown")
    finally:
        c.close()
        logger.info("Consumer closed")

if __name__ == "__main__":
    asyncio.run(async_main())