.PHONY: api scraper applier sync generate_migration apply_migration

MSG ?= update schema

sync:
	uv sync --all-packages

api:
	uv run --package webapi uvicorn webapi.main:app --reload

generate_migration:
	uv run --package webapi alembic revision --autogenerate -m "$(MSG)"

apply_migration:
	uv run --package webapi alembic upgrade head

scraper:
	uv run --package job_scraper python -m job_scraper

applier:
	uv run --package job_applier python -m job_applier