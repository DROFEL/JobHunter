#!/usr/bin/env bash
set -euo pipefail

# --- Kafka topics ---
wait_for_kafka() {
  echo "Waiting for Kafka..."
  until docker exec kafka /opt/kafka/bin/kafka-broker-api-versions.sh \
      --bootstrap-server localhost:9092 &>/dev/null; do
    sleep 2
  done
  echo "Kafka ready."
}

create_kafka_topics() {
  local topics=("postings.scrape")
  for topic in "${topics[@]}"; do
    docker exec kafka /opt/kafka/bin/kafka-topics.sh \
      --bootstrap-server localhost:9092 \
      --create --if-not-exists \
      --topic "$topic" \
      --partitions 3 \
      --replication-factor 1
    echo "Topic: $topic"
  done
}

# --- MinIO buckets ---
wait_for_minio() {
  echo "Waiting for MinIO..."
  until curl -sf http://localhost:9000/minio/health/live &>/dev/null; do
    sleep 2
  done
  echo "MinIO ready."
}

create_minio_buckets() {
  local buckets=("resumes" "posting-artifacts" "crawler-state")
  # Use mc (MinIO client) inside the minio container
  docker exec "$(docker compose ps -q minio)" sh -c \
    "mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null || true"
  for bucket in "${buckets[@]}"; do
    docker exec "$(docker compose ps -q minio)" sh -c \
      "mc mb --ignore-existing local/$bucket"
    echo "Bucket: $bucket"
  done
}

wait_for_kafka
create_kafka_topics
wait_for_minio
create_minio_buckets
echo "Bootstrap complete."
