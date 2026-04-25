from confluent_kafka import Producer
from opentelemetry import propagate
from common.logging_config import get_logger

conf = {
    "bootstrap.servers": "localhost:9094",
}

producer = Producer(conf)


def trace_headers() -> list[tuple[str, str]]:
    carrier: dict[str, str] = {}
    propagate.inject(carrier)
    return list(carrier.items())


def delivery_report(err, msg):
    logger = get_logger(__name__)
    if err:
        logger.info(f"[kafka] delivery failed — topic={msg.topic()} partition={msg.partition()} error={err}")
    else:
        logger.info(f"[kafka] delivered — topic={msg.topic()} partition={msg.partition()} offset={msg.offset()}")
