# Deploy HirKaar frontend on Vercel

Vercel runs **only the Next.js app** in **`frontend/`**. **FastAPI** can run on **[Render](https://render.com)** (see **`deploy/render.md`**), another host, or a **second Vercel project** that serves the API. **PostgreSQL** must be reachable by that API (e.g. **[Neon](https://neon.tech)**).

The Next.js **server** calls FastAPI using **`API_BASE_URL`** (or legacy **`API_INTERNAL_URL`**) in route handlers. The browser only talks to your Next app (`/api/*`); it does **not** need a `NEXT_PUBLIC_*` URL for the API.

### Two Vercel projects (typical pattern)

| App | Example |
|-----|--------|
| Next (this project) | `https://your-app.vercel.app` |
| FastAPI (separate deploy) | `https://your-api.vercel.app` |

On the **frontend** Vercel project set **`API_BASE_URL`** to the API origin (**no trailing slash**). Set **`NEXT_PUBLIC_APP_URL`** to the frontend origin so builds and any future absolute links match that environment.

## 1. Deploy the API and database

If the API is not on Vercel: follow **`deploy/render.md`** (API in `backend/`) and Neon for Postgres, then copy the public API URL (e.g. `https://hirekaar-api.onrender.com`). If the API is already deployed on another host (including a separate Vercel project), use that HTTPS origin as **`API_BASE_URL`**.

## 2. Import the repo on Vercel

1. [Vercel Dashboard](https://vercel.com/new) → import this Git repository.
2. **Root directory:** **`frontend`** (where `frontend/package.json` lives).
3. **Build / Output:** defaults for Next.js (no Docker output on Vercel).

## 3. Environment variables (Vercel → Settings → Environment Variables)

| Name | Value | Notes |
|------|--------|--------|
| `API_BASE_URL` | `https://your-api-host.example` | **No trailing slash.** HTTPS origin of FastAPI (Render, Vercel API project, etc.). |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Public URL of **this** Next app (same host users open in the browser). |

`API_INTERNAL_URL` is still supported if unset; prefer **`API_BASE_URL`**.

On Vercel, if **`API_BASE_URL` is omitted**, the app falls back to a built-in default API host for production convenience—**set `API_BASE_URL` explicitly** whenever your API URL can change (staging, new domain, new backend project).

Add the same values for **Preview** and **Production** as appropriate.

## 4. Deploy

Push or deploy from the dashboard. If login fails, check **`API_BASE_URL`** and that **`GET /health`** on the API works over HTTPS.

## 5. Production checklist

- Strong **`JWT_SECRET`** on the API.
- **`CORS_ORIGINS`** on the API includes your Next app origin(s) if anything calls the API from the browser.
- Neon: **`sslmode=require`** in **`DATABASE_URL`**.
