# Deploy HirKaar frontend on Vercel

Vercel runs **only the Next.js app** in **`frontend/`**. **FastAPI** should run on **[Render](https://render.com)** — see **`deploy/render.md`**. **PostgreSQL** is on **[Neon](https://neon.tech)** (or any reachable Postgres) behind the API.

The Next.js **server** calls FastAPI using **`API_BASE_URL`** (or legacy **`API_INTERNAL_URL`**) in route handlers.

## 1. Deploy the API and database

Follow **`deploy/render.md`** (API in `backend/`) and Neon for Postgres. Copy the public API URL (e.g. `https://hirekaar-api.onrender.com`).

## 2. Import the repo on Vercel

1. [Vercel Dashboard](https://vercel.com/new) → import this Git repository.
2. **Root directory:** **`frontend`** (where `frontend/package.json` lives).
3. **Build / Output:** defaults for Next.js (no Docker output on Vercel).

## 3. Environment variables (Vercel → Settings → Environment Variables)

| Name | Value | Notes |
|------|--------|--------|
| `API_BASE_URL` | `https://your-api-host.example` | **No trailing slash.** Public HTTPS URL of your Render API. |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Public URL of this Next app. |

`API_INTERNAL_URL` is still supported if unset; prefer **`API_BASE_URL`**.

Add the same values for **Preview** and **Production** as appropriate.

## 4. Deploy

Push or deploy from the dashboard. If login fails, check **`API_BASE_URL`** and that **`GET /health`** on the API works over HTTPS.

## 5. Production checklist

- Strong **`JWT_SECRET`** on the API (Render).
- **`CORS_ORIGINS`** on the API includes your Vercel origin(s) if anything calls the API from the browser.
- Neon: **`sslmode=require`** in **`DATABASE_URL`**.
