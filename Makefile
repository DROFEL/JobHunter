ifneq (,$(wildcard ./.env))
  include .env
  export
endif

.PHONY: setup start frontend api scraper applier sync generate_migration apply_migration setup-scraper

MSG ?= update schema

setup:
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example — fill in secrets before running")
	docker compose -f compose.yml up -d
	cd frontend && deno install
	$(MAKE) sync
	$(MAKE) setup-scraper
	bash service_configs/bootstrap/bootstrap.sh

sync:
	uv sync --all-packages

setup-scraper:
	uv run --package job_scraper python -m camoufox fetch

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