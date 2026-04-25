from confluent_kafka import Producer
from common.logging_config import get_logger
conf = {
    "bootstrap.servers": "localhost:9094",
}

producer = Producer(conf)


def delivery_report(err, msg):
    logger = get_logger(__name__)
    if err:
        logger.info(f"[kafka] delivery failed — topic={msg.topic()} partition={msg.partition()} error={err}")
    else:
        logger.info(f"[kafka] delivered — topic={msg.topic()} partition={msg.partition()} offset={msg.offset()}")
