from confluent_kafka import Producer

conf = {
    "bootstrap.servers": "localhost:9094",
}

producer = Producer(conf)


def delivery_report(err, msg):
    if err:
        print(f"[kafka] delivery failed — topic={msg.topic()} partition={msg.partition()} error={err}")
    else:
        print(f"[kafka] delivered — topic={msg.topic()} partition={msg.partition()} offset={msg.offset()}")
