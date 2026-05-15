# HirKaar

InDrive-style marketplace: **customers** post jobs, **workers** bid with their own price, **customers** accept one offer. **10% platform fee** is recorded when a bid is accepted (debited from the worker’s wallet). **Workers** can **top up** the wallet and pay for **featured** placement (homepage section). **Admins** see aggregate stats.

**Stack:** **Next.js 15** (App Router) under **`frontend/`** + **FastAPI** under **`backend/`** + **PostgreSQL 18** (Alembic). **Pakistan first** (`country` default `PK`, cities in UI); schema supports **worldwide** expansion via `country` + `city` fields.

## Quick start (Docker — full stack, one `.env`)

```bash
cp .env.example .env
docker compose up --build
docker compose exec api python scripts/seed_demo.py
```

`docker-compose.yml` loads the **same root `.env`** into **`api`**, **`web`**, and substitutes variables for **`db`**. Open [http://localhost:3000](http://localhost:3000). Demo logins: phones `03000000000`–`03000000002`, password `Demo1234!`.

- **Customer:** `/customer/jobs`, post jobs, accept bids, complete jobs. **Nearby workers** uses GPS or a **city list**; workers share location from **`/worker/dashboard`**.  
- **Live map (accepted job):** OSM map, worker pin, optional job site, OSRM route. API: `GET/POST /jobs/{id}/tracking`, `PATCH /jobs/{id}/site`.  
- **Worker:** `/worker/dashboard`, profile, `/worker/wallet`, browse **`/customer/jobs`** to bid.  
- **Admin:** `/admin` (after seeding admin user).

### Environment (single `.env`)

| Area | Variables |
|------|-----------|
| **Postgres** | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST`, `POSTGRES_PORT` (used by the `db` container and to **build** `DATABASE_URL` for the API when `DATABASE_URL` is left empty). |
| **API** | Optional full **`DATABASE_URL`** (`postgresql+psycopg2://…`, e.g. Neon). Otherwise **`JWT_SECRET`**, **`CORS_ORIGINS`**, fees, etc. |
| **Next.js** | **`API_BASE_URL`** — FastAPI base URL for server-side proxy (Compose: `http://api:8000`). **`NEXT_PUBLIC_APP_URL`** — browser URL of the app (`http://localhost:3000`). Legacy: **`API_INTERNAL_URL`** is still read if `API_BASE_URL` is unset. |

Copy **`.env.example`** → **`.env`** at the **repository root**. `frontend/next.config.ts` loads **`../.env`** when you run Next from `frontend/`, so **`npm run dev`** does not require a second file. If you still have **`.env.backend`** / **`.env.frontend`** from an older layout, merge their keys into one root **`.env`** (Compose only reads **`.env`** now).

**Local Next without Docker:**

```bash
cd frontend && npm install && npm run dev
```

Use **`API_BASE_URL=http://127.0.0.1:8000`** in root **`.env`** when FastAPI runs on the host.

After pulling changes, run **`cd frontend && npm ci`** (or `npm install`) so `node_modules` matches **`package-lock.json`**.

### PostgreSQL 18 Docker volume

Official **`postgres:18`** images expect the volume at **`/var/lib/postgresql`**. If the DB container exits after an older layout:

```bash
docker compose down -v
docker compose up --build
```

### Layout

| Path | Role |
|------|------|
| **`.env`** / **`.env.example`** | **Full stack** — Docker Compose + defaults for deploy docs. |
| **`frontend/`** | Next.js app (`package.json`, `src/`, `Dockerfile`, `Dockerfile.dev`). **Deploy root** for Vercel / static Docker build (`context: ./frontend`). |
| **`backend/`** | FastAPI + Alembic. **Deploy root** for Render / API image (`context: ./backend`). |
| `frontend/src/app/customer/*` | Customer UX |
| `frontend/src/app/worker/*` | Worker UX |
| `frontend/src/app/admin/*` | Admin UX |
| `backend/app/routers/*` | REST API |
| `backend/alembic/versions/*` | DB migrations |

Next.js calls FastAPI via **server** `fetch` using the **`hk_token`** httpOnly cookie (`/api/auth/*` sets it; `/api/hirekaar/[[...path]]` proxies authenticated API calls).

### Deploy notes

- **Vercel (frontend):** set project **Root Directory** to **`frontend`**. Env: **`API_BASE_URL`**, **`NEXT_PUBLIC_APP_URL`**. Details: `deploy/vercel.md`.
- **Render (API):** **Root Directory** **`backend`**, Docker **`Dockerfile`**. Env: **`DATABASE_URL`** *or* **`POSTGRES_*`**, **`JWT_SECRET`**, **`CORS_ORIGINS`**, … — copy from **`.env.example`**. Details: `deploy/render.md`.
- **Postgres (e.g. Neon):** set **`DATABASE_URL`** on the API host (`postgresql+psycopg2://…?sslmode=require`).
- **Other:** `deploy/k8s/README.md`, `deploy/ecs/README.md`, `deploy/azure-app-service.md`.
