.PHONY: setup start frontend api scraper applier sync generate_migration apply_migration

MSG ?= update schema

setup:
	docker compose -f compose.yml up -d
	cd frontend && deno install
	$(MAKE) sync
	bash service_configs/bootstrap/bootstrap.sh

sync:
	uv sync --all-packages

start:
	trap 'kill 0' INT TERM; \
	$(MAKE) frontend & \
	$(MAKE) api & \
	$(MAKE) scraper & \
	wait

frontend:
	cd frontend && deno run dev

api:
	uv run --package webapi uvicorn webapi.main:app --reload

generate_migration:
	uv run --package webapi alembic revision --autogenerate -m "$(MSG)"

apply_migration:
	uv run --package webapi alembic upgrade head

scraper:
	uv run --package job_scraper watchfiles "python -m job_scraper" services/job_scraper

applier:
	uv run --package job_applier watchfiles "python -m job_applier" services/job_applier