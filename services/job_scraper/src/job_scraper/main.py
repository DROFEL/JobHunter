import asyncio
import concurrent.futures
import json
import logging
import os
import signal

from dotenv import load_dotenv
from confluent_kafka import Consumer
from opentelemetry import propagate, trace
from opentelemetry.trace import Link, StatusCode

from common.logging_config import get_logger, setup_logging
from common.tracing_config import get_tracer

load_dotenv()
from db import Base, engine
from job_scraper.process_request import process_scrape_request
from job_scraper.search_worker import handle_search


KAFKA_BOOTSTRAP = "localhost:9094"


def _make_consumer(group_id: str) -> Consumer:
    return Consumer({
        "bootstrap.servers": KAFKA_BOOTSTRAP,
        "group.id": group_id,
        "auto.offset.reset": "earliest",
        "session.timeout.ms": 6000,
        "heartbeat.interval.ms": 2000,
    })


async def _close_consumer(loop: asyncio.AbstractEventLoop, c: Consumer) -> None:
    try:
        await asyncio.wait_for(loop.run_in_executor(None, c.close), timeout=3.0)
    except Exception:
        pass


async def _run_scrape_consumer() -> None:
    logger = get_logger(__name__)
    tracer = get_tracer(__name__)
    c = _make_consumer("worker-group")
    loop = asyncio.get_event_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    def _on_assign(consumer, partitions):
        logger.info(f"Partitions assigned: {[p.partition for p in partitions]}")

    c.subscribe(["postings.scrape"], on_assign=_on_assign)
    try:
        while True:
            msg = await loop.run_in_executor(executor, lambda: c.poll(1.0))
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error (postings.scrape): {msg.error()}")
                continue

            posting_id = msg.key().decode("utf-8")
            raw_value = msg.value().decode("utf-8")
            logger.info(f"Received posting id {posting_id} and value {raw_value}")
            try:
                payload = json.loads(raw_value)
                posting_url = payload["url"]
                attempt = int(payload.get("attempt", 0))
            except (json.JSONDecodeError, KeyError, TypeError):
                # backwards-compat: old messages were raw URL strings
                posting_url = raw_value
                attempt = 0

            headers = {k: v.decode("utf-8", errors="replace") for k, v in (msg.headers() or [])}
            parent_ctx = propagate.extract(headers)
            parent_span_ctx = trace.get_current_span(parent_ctx).get_span_context()
            links = [Link(parent_span_ctx)] if parent_span_ctx.is_valid else []
            with tracer.start_as_current_span("postings.scrape.process", links=links) as span:
                span.set_attribute("kafka.topic", msg.topic())
                span.set_attribute("kafka.key", posting_id)
                try:
                    await process_scrape_request(url=posting_url, posting_id=posting_id, attempt=attempt)
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(StatusCode.ERROR)
                    logger.exception(f"Unhandled error for posting_id={posting_id} at {posting_url}")
    except asyncio.CancelledError:
        logger.info("Graceful shutdown (postings.scrape)")
    finally:
        await _close_consumer(loop, c)
        executor.shutdown(wait=False)


async def _run_search_consumer() -> None:
    logger = get_logger(__name__)
    tracer = get_tracer(__name__)
    c = _make_consumer("search-worker-group")
    loop = asyncio.get_event_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    c.subscribe(["searches.discover"])
    try:
        while True:
            msg = await loop.run_in_executor(executor, lambda: c.poll(1.0))
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error (searches.discover): {msg.error()}")
                await asyncio.sleep(1.0)
                continue

            try:
                payload = json.loads(msg.value().decode("utf-8"))
            except json.JSONDecodeError:
                logger.exception("Invalid JSON on searches.discover")
                continue

            headers = {k: v.decode("utf-8", errors="replace") for k, v in (msg.headers() or [])}
            ctx = propagate.extract(headers)
            with tracer.start_as_current_span("searches.discover.handle", context=ctx) as span:
                span.set_attribute("kafka.topic", msg.topic())
                try:
                    await handle_search(payload)
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(StatusCode.ERROR)
                    logger.exception(f"Search discovery failed for payload={payload}")
    except asyncio.CancelledError:
        logger.info("Graceful shutdown (searches.discover)")
    finally:
        await _close_consumer(loop, c)
        executor.shutdown(wait=False)


async def async_main():
    Base.metadata.create_all(bind=engine)
    log_level = getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO)
    setup_logging(level=log_level)
    logger = get_logger(__name__)

    loop = asyncio.get_running_loop()
    main_task = asyncio.current_task()

    def _shutdown(sig: signal.Signals) -> None:
        if main_task.cancelling():
            return
        logger.info(f"Received {sig.name}, shutting down")
        main_task.cancel()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, _shutdown, sig)

    try:
        await asyncio.gather(_run_scrape_consumer(), _run_search_consumer())
    except asyncio.CancelledError:
        logger.info("Consumer closed")


if __name__ == "__main__":
    asyncio.run(async_main())
