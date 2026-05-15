# Deploy the HirKaar API on Render

Use a Render **Web Service** with **Root directory** **`backend`** (uses `backend/Dockerfile`). **Postgres** is usually **[Neon](https://neon.tech)** or another managed database.

## 1. Prerequisites

- Either a full **`DATABASE_URL`** (`postgresql+psycopg2://…?sslmode=require` for Neon), **or** set **`POSTGRES_HOST`**, **`POSTGRES_PORT`**, **`POSTGRES_USER`**, **`POSTGRES_PASSWORD`**, **`POSTGRES_DB`** and leave **`DATABASE_URL`** empty — the API builds the URL automatically (see **`.env.example`**).
- **Alembic** runs on each container start (`docker-entrypoint.sh`: `alembic upgrade head` then `uvicorn`).

## 2. Create the Web Service

1. [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service** → connect this repository.
2. **Root directory:** **`backend`**.
3. **Runtime:** **Docker**.
4. **Instance type:** paid if you need no cold starts.

## 3. Environment variables (Render → Environment)

Paste from **`.env.example`** (API + Postgres sections). Minimum:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | **Or** omit and set `POSTGRES_*` instead. |
| `POSTGRES_HOST` / `POSTGRES_PORT` / `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Required if `DATABASE_URL` is empty. |
| `JWT_SECRET` | Strong secret (`openssl rand -hex 32`). |
| `CORS_ORIGINS` | Include your **Vercel** URL(s). |
| `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `PLATFORM_FEE_RATE`, `BOOST_PRICE_PER_DAY_MINOR` | Optional; defaults in **`.env.example`**. |

Do **not** set `PORT` unless you change the image; the API listens on **8000**.

## 4. Health check

Set **Health Check Path** to **`/health`**.

## 5. Wire the frontend (Vercel)

Use your Render URL as **`API_BASE_URL`** on Vercel (**no trailing slash**). Set **`NEXT_PUBLIC_APP_URL`** to the Vercel site URL. See **`deploy/vercel.md`**.

## 6. One-off tasks (optional)

- **Seed:** `cd backend && DATABASE_URL='postgresql+psycopg2://…' python scripts/seed_demo.py` (with `PYTHONPATH` / Docker as in README).
- **Migrations only:** `cd backend && alembic upgrade head` with env loaded.
