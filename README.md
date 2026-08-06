# Asset Management System

A lightweight, generic asset management and maintenance tracking system. It is built around two
core concepts — **Assets** and **Events** — and is designed so that new asset types (Printer,
Computer, Router, ...) and new event types (Maintenance, Repair, Moved, ...) can be added entirely
through the UI, with no code changes.

## Tech Stack

**Backend:** FastAPI, SQLAlchemy 2.x, SQLite, Alembic, Pydantic v2
**Frontend:** React, React Router v7, TypeScript, Vite, shadcn/ui, Tailwind CSS, TanStack Query,
React Hook Form, Zod

## Project Structure

```
backend/
    app/
        api/            # FastAPI routers (HTTP layer only)
        core/           # config, exceptions
        db/             # engine/session, declarative base, seed data
        models/         # SQLAlchemy ORM models
        repositories/   # data-access layer
        schemas/        # Pydantic request/response models
        services/       # business logic
        main.py         # FastAPI app entrypoint
    migrations/         # Alembic migrations
    alembic.ini
    pyproject.toml

frontend/
    src/
        api/            # typed API client + endpoint functions
        components/     # shared/reusable components (incl. shadcn/ui in components/ui)
        features/       # feature-scoped hooks, forms, dialogs (assets, asset-types, ...)
        layouts/        # app shell (sidebar, top nav)
        lib/            # utilities, query keys
        routes/         # page components + router config
```

## Data Model

- **AssetType** (`id`, `name`, `description`) — 1 → many Assets
- **Asset** (`id`, `asset_type_id`, `name`, `inventory_number`, `serial_number`, `status`,
  `location`, `responsible_person`, `notes`, timestamps) — 1 → many AssetEvents
- **EventType** (`id`, `name`, `description`) — 1 → many AssetEvents
- **AssetEvent** (`id`, `asset_id`, `event_type_id`, `event_date`, `description`, `performed_by`,
  `cost`, `created_at`)

Both `AssetType` and `EventType` are plain database-backed lookup tables — creating, renaming or
deleting them via the "Asset Types" / "Event Types" pages immediately affects what's available
throughout the app, with no redeploy required.

## Getting Started

### Prerequisites

- Python 3.12+ and [uv](https://docs.astral.sh/uv/)
- Node.js 20+ and npm

### Backend

```bash
cd backend
uv sync                        # installs dependencies into .venv
cp .env.example .env           # optional, defaults already work
uv run alembic upgrade head    # create the SQLite database
uv run uvicorn app.main:app --reload
```

The API is now running at `http://127.0.0.1:8000`.

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Health check: http://127.0.0.1:8000/health

On first startup, the database is automatically seeded with sample asset types, event types, and
demo assets/events (see `app/db/seed.py`). Seeding only runs if the `asset_types` table is empty,
so it's safe to restart the server repeatedly.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env           # optional, defaults already work
npm run dev
```

The app is now running at `http://localhost:5173`. The Vite dev server proxies `/api/*` requests
to `http://127.0.0.1:8000`, so make sure the backend is running first.

## API Overview

All endpoints are served under the `/api` prefix.

| Resource     | Endpoints |
|--------------|-----------|
| Asset Types  | `GET/POST /asset-types`, `PUT/DELETE /asset-types/{id}` |
| Event Types  | `GET/POST /event-types`, `PUT/DELETE /event-types/{id}` |
| Assets       | `GET/POST /assets`, `GET/PUT/DELETE /assets/{id}` (list supports `search`, `status`, `asset_type_id`, `sort_by`, `sort_dir`, `page`, `page_size`) |
| Events       | `GET/POST /assets/{id}/events`, `PUT/DELETE /events/{id}` |
| Dashboard    | `GET /dashboard/summary` |

Full interactive documentation is available at `/docs` while the backend is running.

## Database Migrations

Migrations live in `backend/migrations`. To create a new migration after changing a model:

```bash
cd backend
uv run alembic revision --autogenerate -m "describe the change"
uv run alembic upgrade head
```

## Extensibility

The system was designed to grow without major refactoring:

- **New asset/event types**: created entirely through the UI (or API) — no code changes.
- **Attachments, QR codes, auth, roles, notifications, scheduled maintenance**: the clean
  separation between API routes, services, repositories, and schemas keeps room to add these as
  new modules without touching existing ones.
- **PostgreSQL**: swap the `DATABASE_URL` in `backend/.env` (e.g.
  `postgresql+psycopg://user:pass@host/db`) and install a Postgres driver — SQLAlchemy 2.x and
  Alembic already abstract over the database engine.
