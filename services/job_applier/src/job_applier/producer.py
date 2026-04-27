import json

from confluent_kafka import Producer
from opentelemetry import propagate

from common.config import get_settings
from common.logging_config import get_logger

_producer = Producer({"bootstrap.servers": get_settings().kafka_bootstrap_servers})


def _delivery_report(err, msg):
    logger = get_logger(__name__)
    if err:
        logger.error(f"[kafka] delivery failed — topic={msg.topic()} error={err}")
    else:
        logger.info(f"[kafka] delivered — topic={msg.topic()} offset={msg.offset()}")


def _trace_headers() -> list[tuple[str, str]]:
    carrier: dict[str, str] = {}
    propagate.inject(carrier)
    return list(carrier.items())


def send_to_dlq(posting_id: str, error: str, attempts: int = 1) -> None:
    _producer.produce(
        topic="postings.apply.dlq",
        key=posting_id,
        value=json.dumps({"posting_id": posting_id, "error": error, "attempts": attempts}),
        headers=_trace_headers(),
        on_delivery=_delivery_report,
    )
    _producer.flush(timeout=10)
