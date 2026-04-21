
from db import Base, engine


Base.metadata.create_all(bind=engine)

from confluent_kafka import Consumer

c = Consumer({
    "bootstrap.servers": "localhost:9094",
    "group.id": "worker-group",
    "auto.offset.reset": "earliest",
})

c.subscribe(["jobs"])

try:
    while True:
        msg = c.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print("Consumer error:", msg.error())
            continue

        print("key:", msg.key())
        print("value:", msg.value().decode("utf-8"))
finally:
    c.close()