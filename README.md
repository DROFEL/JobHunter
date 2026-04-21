# JobHunter (WIP)

A full-stack job search automation platform — scrape job postings, tailor resumes with AI assistance, track applications, and (soon) auto-apply. Built as a personal tool and a demonstration of event-driven, service-oriented backend architecture.

---

## Screenshots

> _Add screenshots here_

| Resume Workbench | Profile Settings |
|---|---|
| ![Resume Workbench](docs/screenshots/resume-workbench.png) | ![Settings](docs/screenshots/settings.png) |

---

## Architecture

> _Add architecture diagram here_

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│              React 19 + TanStack Router/Query               │
└────────────────────────┬────────────────────────────────────┘
                         │ REST (JSON)
┌────────────────────────▼────────────────────────────────────┐
│                     WebAPI (FastAPI)                        │
│   /users  /jobs  /resume-templates  /profile  /ai          │
└──────┬──────────────────────────────────────┬───────────────┘
       │ SQLAlchemy ORM                        │ (future: produce)
┌──────▼──────────┐                  ┌────────▼────────────────┐
│  PostgreSQL 17  │                  │    Apache Kafka 4.1      │
│  Users          │                  │    topic: jobs           │
│  Postings       │                  └────┬────────────────┬───┘
│  Companies      │                       │ consume        │ consume
│  ResumeTemplates│              ┌────────▼──────┐  ┌──────▼──────────────┐
└─────────────────┘              │  Job Scraper  │  │   Job Applier       │
                                 │  Playwright   │  │   browser-use (WIP) │
┌────────────────────────────────│  LangChain +  │  └─────────────────────┘
│  MinIO (S3-compatible)         │  OpenRouter   │
│  Raw HTML / extracted JSON ◄───┘               │
└────────────────────────────────────────────────┘

  Jaeger (OpenTelemetry) — distributed tracing across all services
  Prometheus — metrics scraping from API and workers (port 9090)
```

---

## What It Does

### Resume Builder
A three-panel workbench: job selector sidebar, structured form editor, and live PDF preview. Users maintain multiple resume versions, switch templates, and export to PDF. Sections cover contact info, summary, work experience, projects, skills, and languages.

### AI Assistance
REST endpoint (`POST /ai/generate`) accepts a `call_type` (`job_summary`, `resume_summary`, `work_experience`), a user prompt, and optional context. Drives LLM calls (LangChain + OpenRouter) to generate tailored resume content and summarize job postings against the user's profile. The interface is fully wired; LLM integration is the active development surface.

### Job Scraping Pipeline
The scraper service consumes messages from a Kafka topic, launches a headless Firefox browser via Crawlee + Playwright, extracts structured job data using an LLM with JSON schema validation (LangChain + GPT-4 mini via OpenRouter), and persists raw and structured output to MinIO. Consumer group offset management ensures at-least-once delivery.

### Job Application Automation
The applier service consumes the same Kafka topic (separate consumer group) and will use `browser-use` to fill and submit job applications automatically. Currently scaffolded; browser automation logic is in development.

### Job & Application Tracking
Full CRUD for saved jobs with scrape status tracking, external job board ID references, and per-job resume associations stored in PostgreSQL.

### Profile Settings
Persistent profile data (skills pool, languages + proficiency, education, work history) stored as flexible JSON in PostgreSQL and used as context for AI generation and resume pre-population.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| API framework | FastAPI (Python 3.12) |
| ORM | SQLAlchemy + Alembic migrations |
| Database | PostgreSQL 17 |
| Message queue | Apache Kafka 4.1 (KRaft mode, no ZooKeeper) |
| Object storage | MinIO (S3-compatible) |
| Web scraping | Crawlee + Playwright (headless Firefox) |
| LLM orchestration | LangChain + OpenRouter |
| Browser automation | browser-use |
| Observability | Jaeger (OpenTelemetry OTLP) + Prometheus |
| Package management | uv (workspace with shared `db` and `common` packages) |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Routing | TanStack Router (file-based) |
| Server state | TanStack React Query |
| Styling | Tailwind CSS 4 + Radix UI |
| Forms | React Hook Form + Zod |
| Build | Vite |
| PDF export | html2pdf.js + @react-pdf/renderer |
| API mocking | MSW (Mock Service Worker) |

---

## Service Layout

```
/
├── compose.yml                  # PostgreSQL, Kafka, MinIO, Jaeger
├── frontend/                    # React app (Vite)
├── services/
│   ├── webapi/                  # FastAPI REST API
│   ├── job_scraper/             # Kafka consumer + Playwright crawler
│   └── job_applier/             # Browser automation worker (WIP)
└── packages/
    ├── db/                      # Shared SQLAlchemy models & session
    └── common/                  # Shared utilities
```

---

## Data Flow

1. A scrape request is published to the `jobs` Kafka topic.
2. **Job Scraper** picks it up, crawls the target URL with Playwright, extracts structured data via LangChain/LLM, and stores results in MinIO + PostgreSQL.
3. **Job Applier** (same topic, separate consumer group) will auto-fill the application using browser automation.
4. The user opens the **Resume Workbench**, selects a saved job, edits their resume, and uses **AI generation** to tailor the summary and experience to the specific posting.
5. The finalized resume is exported as PDF.

---

## Reliability Design

- **Kafka with 3 partitions** — horizontal scalability for worker processes and fault-tolerant message delivery.
- **Consumer group offset management** — workers resume from their last committed offset after restart; no jobs are lost or double-processed.
- **MinIO for artifact storage** — raw crawl results and extracted JSON are persisted independently of the database, providing a replay source and audit trail.
- **Alembic migrations** — schema changes are versioned and repeatable across environments.
- **Health endpoint** (`GET /health`) on the API for container liveness checks.
- **Distributed tracing** via Jaeger/OpenTelemetry — request traces span the API and background services for latency visibility and debugging.
- **Prometheus metrics** — scrapes the API `/metrics` endpoint every 15s; 15-day TSDB retention; config mounted from `prometheus.yml` for easy target extension.
- **KRaft-mode Kafka** — no ZooKeeper dependency; simpler ops that mirrors a real production topology.

---

## Running Locally

**Prerequisites:** Docker, Python 3.12+, Node.js 20+, `uv`

```bash
# Start infrastructure
docker compose up -d

# Install Python dependencies (uv workspace)
uv sync

# Run migrations
cd services/webapi && alembic upgrade head

# Start API
make api

# Start frontend
cd frontend && npm install && npm run dev

# Start scraper worker
make scraper
```

---

## Roadmap

- [x] Resume builder with live preview and PDF export
- [x] Profile settings (skills, languages, education)
- [x] Job management (CRUD, scrape status tracking)
- [x] Kafka-based scraper pipeline with LLM extraction
- [x] AI generation API (endpoint + typed schema)
- [ ] LLM integration for resume tailoring (OpenRouter)
- [ ] Job search UI
- [ ] Dashboard (application pipeline view)
- [ ] Job applier browser automation
- [ ] Auth (replace header-based user ID with real sessions)

---

## Key Engineering Decisions

**Kafka over direct HTTP between services** — decouples scraper and applier lifecycle from the API. Workers can be scaled, restarted, or swapped without touching the API layer, and messages survive worker downtime.

**KRaft-mode Kafka (no ZooKeeper)** — reduces infrastructure surface area for a single-node dev environment while keeping the topology consistent with production.

**uv workspace** — shared `db` and `common` packages are referenced as local path dependencies across all three Python services, avoiding code duplication while keeping services independently deployable.

**Flexible JSON columns in PostgreSQL** — user profile data and resume content use structured JSON fields, allowing schema evolution for user-facing data without Alembic migrations on every change.

**LangChain + OpenRouter** — model-agnostic LLM routing lets the scraper and AI generation service swap underlying models (GPT-4 mini today, others tomorrow) without code changes.

**MSW for frontend development** — API responses are mocked at the network layer during development, allowing the frontend to be built and tested without a running backend.
