# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A generic asset management / maintenance-tracking system built around **Assets** and **Events**.
New asset types (Printer, Computer, Router, ...) and event types (Maintenance, Repair, Moved, ...)
are created entirely through the UI/API as database-backed lookup rows — never hardcoded, never
require a code change or redeploy.

**Backend:** FastAPI, SQLAlchemy 2.x, SQLite (Postgres-compatible via `DATABASE_URL`), Alembic,
Pydantic v2, Celery + Redis (backups).
**Frontend:** React 19, React Router v7, TypeScript, Vite, shadcn/ui, Tailwind CSS v4, TanStack
Query, React Hook Form, Zod.

There is currently no test suite in the repo (no pytest, no vitest) — don't assume one exists.

## Commands

### Backend (from `backend/`)

```bash
uv sync                                    # install deps into .venv
uv run alembic upgrade head                # apply migrations / create the SQLite db
uv run uvicorn app.main:app --reload       # dev server at :8000 (docs at /docs)
uv run alembic revision --autogenerate -m "describe the change"   # new migration after a model change
```

Backups run on Celery and need Redis plus a worker and beat process (not needed unless touching
the backup feature):

```bash
redis-server
uv run celery -A app.celery_app worker --loglevel=info
uv run celery -A app.celery_app beat --loglevel=info
```

### Frontend (from `frontend/`)

```bash
npm install
npm run dev       # Vite dev server at :5173, proxies /api/* to 127.0.0.1:8000
npm run build      # tsc -b && vite build — treat tsc errors as build failures
npm run lint       # oxlint
```

### Whole stack via Docker

`./start.sh dev` (bind-mounted hot reload) or `./start.sh` (prod: nginx + built frontend, port 80)
from the repo root. Both compose files load the single root `.env` via `env_file`.

## Architecture

### Backend layering (`backend/app/`)

Strict one-directional dependency chain — never skip a layer:

```
api/routes/*  →  services/*  →  repositories/*  →  models/* (SQLAlchemy ORM)
                       ↑              ↑
                  schemas/*      db/base.py (declarative Base), db/session.py
```

- **`api/routes/`** — FastAPI routers, HTTP concerns only (status codes, request/response
  wiring). Auth/role gating is applied per-router in `api/router.py`, not inside individual route
  functions — e.g. `users` and `backups` routers are mounted with
  `dependencies=[Depends(get_current_admin)]`, most others with `get_current_user`, and `auth` is
  unauthenticated.
- **`services/`** — business logic; the only layer allowed to raise domain errors
  (`core/exceptions.py`: `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`),
  which `main.py` maps to HTTP status codes via exception handlers.
- **`repositories/`** — data access only. Most extend the generic `BaseRepository[ModelType]`
  (`repositories/base.py`) for `get`/`list`/`create`/`update`/`delete`; `update()` only touches
  fields explicitly passed as kwargs, so callers decide what changes.
- **`schemas/`** — Pydantic v2 request/response models, decoupled from ORM models.

Auth is custom session-cookie based (`app/models/session.py`, `app/core/security.py`,
`app/api/deps.py`) — no JWT, no third-party auth library. `get_current_user`/`get_current_admin`
in `api/deps.py` are the only auth dependencies; there's no per-object permission system beyond
admin vs. regular user.

### Append-only / no-FK audit tables

`AssetHistory` and `AuditLog` (`models/asset_history.py`, `models/audit_log.py`) intentionally have
**no foreign keys** — they must stay readable after the source asset/event rows are deleted.
`AssetHistory` snapshots a disposed asset plus its full event chain (as JSON) when disposal
happens; `AuditLog` records create/update/delete actions on assets/events. Keep this no-FK,
snapshot-on-write pattern when extending either.

### Backup system (`services/backup/`)

Pluggable delivery via the `BackupTransport` ABC (`services/backup/transport.py`): `send()` takes
a file + recipient identifiers and returns a per-recipient result dict, stored as
`BackupRun.delivery_details`. Telegram (`telegram_transport.py`) is the only implementation today;
new transports (email, S3, ...) plug in behind the same interface, selected via
`services/backup/factory.py`. Recipient credentials/tokens are encrypted at rest with Fernet
(`core/crypto.py`), keyed by `BACKUP_CREDENTIALS_KEY` — required for any backup feature work, not
optional. Scheduling and execution run through Celery (`celery_app.py`, `services/backup/tasks.py`).

### Config

`core/config.py` reads a single root-level `.env` (not `backend/.env`) via `pydantic-settings`,
shared by backend, Celery, and frontend containers. In Docker the backend build context excludes
the repo root, so config there comes entirely from the container environment
(`docker-compose*.yml` `env_file`) instead of the file path.

### Frontend structure (`frontend/src/`)

- **`api/`** — `client.ts` (thin fetch wrapper, cookie-based `credentials: 'include'`,
  dispatches a global `auth:unauthorized` event on 401 instead of throwing into every caller),
  `endpoints.ts` (typed request functions), `types.ts`.
- **`features/<domain>/`** — colocated hooks (TanStack Query), forms (React Hook Form + Zod
  schemas in `*-schema.ts`), and dialogs per domain (assets, backups, users, places, ...).
- **`lib/query-keys.ts`** — the single source of truth for TanStack Query cache keys; add new
  keys here rather than inlining array keys in hooks.
- **`routes/`** — page components + router config.

### Migrations

Alembic revision filenames are content-descriptive, not date-prefixed
(e.g. `bd925cf3210b_asset_naming_rules_and_scoped_inventory_.py`). Always generate them with
`alembic revision --autogenerate` after a model change, then review the generated diff before
applying — autogenerate misses some changes (e.g. column type narrowing).
