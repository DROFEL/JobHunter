from job_scraper.process_request import process_scrape_request
from db import Base, engine
from confluent_kafka import Consumer
from common.logging_config import setup_logging, get_logger

def main():
    Base.metadata.create_all(bind=engine)
    setup_logging()
    logger = get_logger(__name__)
    c = Consumer({
        "bootstrap.servers": "localhost:9094",
        "group.id": "worker-group",
        "auto.offset.reset": "earliest",
    })

    c.subscribe(["scrape_jobs"])

    try:
        while True:
            msg = c.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                print("Consumer error:", msg.error())
                continue
            
            posting_id = msg.key().decode("utf-8")
            posting_url = msg.value().decode("utf-8")
            logger.info(f"Received job with posting_id {posting_id} and url {posting_url}")
            try:
                process_scrape_request(url=posting_url, posting_id=posting_id)
            except Exception:
                logger.exception(f"Failed job for posting_id {posting_id} at {posting_url}")
    finally:
        c.close()