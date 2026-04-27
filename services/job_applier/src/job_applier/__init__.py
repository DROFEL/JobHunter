import asyncio
import concurrent.futures
import json
import logging
import signal

from confluent_kafka import Consumer
from opentelemetry import propagate, trace
from opentelemetry.trace import Link, StatusCode
from psycopg_pool import AsyncConnectionPool
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from common.config import get_settings
from common.logging_config import get_logger, setup_logging
from common.tracing_config import get_tracer
from db import Base, SessionLocal, engine
from job_applier.process import process_application, resume_application
from job_applier.producer import send_to_dlq

_settings = get_settings()
_sem = asyncio.Semaphore(_settings.applier_concurrency)

# Convert SQLAlchemy URL to plain psycopg3 URL for LangGraph checkpointer
_PG_URL = _settings.database_url.replace("postgresql+psycopg://", "postgresql://")


def _make_consumer(group_id: str) -> Consumer:
    return Consumer({
        "bootstrap.servers": _settings.kafka_bootstrap_servers,
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


async def _apply_task(
    posting_id: str,
    user_id: str,
    links: list,
    tracer,
    logger,
    checkpointer,
) -> None:
    try:
        with tracer.start_as_current_span("postings.apply.process", links=links) as span:
            span.set_attribute("kafka.topic", "postings.apply")
            span.set_attribute("posting_id", posting_id)
            try:
                with SessionLocal() as db:
                    await process_application(posting_id, user_id, db, checkpointer)
            except Exception as exc:
                span.record_exception(exc)
                span.set_status(StatusCode.ERROR)
                logger.exception(f"Application failed posting_id={posting_id}")
                send_to_dlq(posting_id, str(exc))
    finally:
        _sem.release()


async def _resume_task(
    session_id: str,
    answers: dict,
    links: list,
    tracer,
    logger,
    checkpointer,
) -> None:
    try:
        with tracer.start_as_current_span("postings.apply.resume", links=links) as span:
            span.set_attribute("kafka.topic", "postings.apply.resume")
            span.set_attribute("session_id", session_id)
            try:
                with SessionLocal() as db:
                    await resume_application(session_id, answers, db, checkpointer)
            except Exception as exc:
                span.record_exception(exc)
                span.set_status(StatusCode.ERROR)
                logger.exception(f"Resume failed session_id={session_id}")
    finally:
        _sem.release()


async def _run_apply_consumer(checkpointer) -> None:
    logger = get_logger(__name__)
    tracer = get_tracer(__name__)
    c = _make_consumer("applier-group")
    loop = asyncio.get_event_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)

    def _on_assign(consumer, partitions):
        logger.info(f"[apply] partitions assigned: {[p.partition for p in partitions]}")

    c.subscribe(["postings.apply"], on_assign=_on_assign)
    try:
        while True:
            msg = await loop.run_in_executor(executor, lambda: c.poll(1.0))
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error (postings.apply): {msg.error()}")
                continue

            try:
                payload = json.loads(msg.value().decode("utf-8"))
                posting_id = payload["posting_id"]
                user_id = payload["user_id"]
            except (json.JSONDecodeError, KeyError, TypeError):
                logger.error("Invalid message on postings.apply")
                continue

            headers = {k: v.decode("utf-8", errors="replace") for k, v in (msg.headers() or [])}
            parent_ctx = propagate.extract(headers)
            parent_span_ctx = trace.get_current_span(parent_ctx).get_span_context()
            links = [Link(parent_span_ctx)] if parent_span_ctx.is_valid else []

            logger.info(f"[apply] received posting_id={posting_id}")
            await _sem.acquire()
            asyncio.create_task(
                _apply_task(posting_id, user_id, links, tracer, logger, checkpointer)
            )
    except asyncio.CancelledError:
        logger.info("Graceful shutdown (postings.apply)")
    finally:
        await _close_consumer(loop, c)
        executor.shutdown(wait=False)


async def _run_resume_consumer(checkpointer) -> None:
    logger = get_logger(__name__)
    tracer = get_tracer(__name__)
    c = _make_consumer("applier-resume-group")
    loop = asyncio.get_event_loop()
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    c.subscribe(["postings.apply.resume"])
    try:
        while True:
            msg = await loop.run_in_executor(executor, lambda: c.poll(1.0))
            if msg is None:
                continue
            if msg.error():
                logger.error(f"Consumer error (postings.apply.resume): {msg.error()}")
                continue

            try:
                payload = json.loads(msg.value().decode("utf-8"))
                session_id = payload["session_id"]
                answers = payload["answers"]
            except (json.JSONDecodeError, KeyError, TypeError):
                logger.error("Invalid message on postings.apply.resume")
                continue

            headers = {k: v.decode("utf-8", errors="replace") for k, v in (msg.headers() or [])}
            parent_ctx = propagate.extract(headers)
            parent_span_ctx = trace.get_current_span(parent_ctx).get_span_context()
            links = [Link(parent_span_ctx)] if parent_span_ctx.is_valid else []

            logger.info(f"[resume] received session_id={session_id}")
            await _sem.acquire()
            asyncio.create_task(
                _resume_task(session_id, answers, links, tracer, logger, checkpointer)
            )
    except asyncio.CancelledError:
        logger.info("Graceful shutdown (postings.apply.resume)")
    finally:
        await _close_consumer(loop, c)
        executor.shutdown(wait=False)


async def async_main():
    Base.metadata.create_all(bind=engine)
    log_level = getattr(logging, _settings.log_level.upper(), logging.INFO)
    setup_logging(level=log_level)
    logger = get_logger(__name__)

    async with AsyncConnectionPool(conninfo=_PG_URL, max_size=5) as pool:
        checkpointer = AsyncPostgresSaver(pool)
        await checkpointer.setup()

        loop = asyncio.get_running_loop()
        main_task = asyncio.current_task()

        def _shutdown(sig: signal.Signals) -> None:
            if main_task.cancelling():
                return
            logger.info(f"Received {sig.name}, shutting down")
            main_task.cancel()

        for sig in (signal.SIGINT, signal.SIGTERM):
            loop.add_signal_handler(sig, _shutdown, sig)

        logger.info("Job applier started — listening on postings.apply and postings.apply.resume")
        try:
            await asyncio.gather(
                _run_apply_consumer(checkpointer),
                _run_resume_consumer(checkpointer),
            )
        except asyncio.CancelledError:
            logger.info("Consumer closed")


def main():
    asyncio.run(async_main())
