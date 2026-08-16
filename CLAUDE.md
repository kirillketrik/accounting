# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A generic asset management / maintenance-tracking system built around **Assets** and **Events**.
New asset types (Printer, Computer, Router, ...) and event types (Maintenance, Repair, Moved, ...)
are created entirely through the UI/API as database-backed lookup rows — never hardcoded, never
require a code change or redeploy.

**Backend:** FastAPI, SQLAlchemy 2.x, Postgres (via `DATABASE_URL`), Alembic, Pydantic v2.
**Frontend:** React 19, React Router v7, TypeScript, Vite, shadcn/ui, Tailwind CSS v4, TanStack
Query, React Hook Form, Zod.

There is currently no test suite in the repo (no pytest, no vitest) — don't assume one exists.

## Commands

### Backend (from `backend/`)

```bash
uv sync                                    # install deps into .venv
uv run alembic upgrade head                # apply migrations (requires Postgres running, e.g. via `./start.sh dev`)
uv run uvicorn app.main:app --reload       # dev server at :8000 (docs at /docs)
uv run alembic revision --autogenerate -m "describe the change"   # new migration after a model change
```

Database backups are handled outside the app by `scripts/backup.sh` (see below), not by any
backend code — there is no in-app backup feature.

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

### Database backups

`scripts/backup.sh` (repo root) runs `pg_dump`/`psql` against the running Postgres container via
`docker exec`, found by container name so it works with either compose file:

```bash
./scripts/backup.sh                  # create a backup in ./backups (gzip'd SQL dump)
./scripts/backup.sh list             # list existing backups
./scripts/backup.sh restore <file>   # restore from a backup file (prompts to confirm; -y skips it)
```

Backups older than `BACKUP_RETENTION` (root `.env`, default 20) are pruned after each run. There
is no backup functionality in the backend or frontend — it was removed because the old in-app
Celery-based backup system didn't work reliably after the Postgres migration; this script is the
only supported way to back up / restore the database now.

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
  functions — e.g. the `users` router is mounted with `dependencies=[Depends(get_current_admin)]`,
  most others with `get_current_user`, and `auth` is unauthenticated.
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

### Config

`core/config.py` reads a single root-level `.env` (not `backend/.env`) via `pydantic-settings`,
shared by backend and frontend containers. In Docker the backend build context excludes the repo
root, so config there comes entirely from the container environment (`docker-compose*.yml`
`env_file`) instead of the file path.

### Frontend structure (`frontend/src/`)

- **`api/`** — `client.ts` (thin fetch wrapper, cookie-based `credentials: 'include'`,
  dispatches a global `auth:unauthorized` event on 401 instead of throwing into every caller),
  `endpoints.ts` (typed request functions), `types.ts`.
- **`features/<domain>/`** — colocated hooks (TanStack Query), forms (React Hook Form + Zod
  schemas in `*-schema.ts`), and dialogs per domain (assets, users, places, ...).
- **`lib/query-keys.ts`** — the single source of truth for TanStack Query cache keys; add new
  keys here rather than inlining array keys in hooks.
- **`routes/`** — page components + router config.

### Migrations

Alembic revision filenames are content-descriptive, not date-prefixed
(e.g. `bd925cf3210b_asset_naming_rules_and_scoped_inventory_.py`). Always generate them with
`alembic revision --autogenerate` after a model change, then review the generated diff before
applying — autogenerate misses some changes (e.g. column type narrowing).
