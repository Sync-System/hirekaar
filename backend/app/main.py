import html
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import text

from app.core.config import get_settings
from app.routers import admin, auth, jobs, public, reviews, users, wallet

logger = logging.getLogger(__name__)

_DEFAULT_JWT = "change-me-use-openssl-rand-hex-32"


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    env = (s.ENVIRONMENT or "development").lower()
    if env in ("production", "prod"):
        if (s.JWT_SECRET or "").strip() == _DEFAULT_JWT or len((s.JWT_SECRET or "").strip()) < 24:
            msg = "ENVIRONMENT=production requires a strong JWT_SECRET (not the default; min 24 chars)."
            logger.critical(msg)
            raise RuntimeError(msg)
    yield


app = FastAPI(title="HirKaar API", version="0.2.0", lifespan=lifespan)

s = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in s.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(wallet.router)
app.include_router(admin.router)
app.include_router(reviews.router)
app.include_router(public.router)


@app.get("/", include_in_schema=True)
def root():
    """Avoid bare `/` returning 404; send humans to the status page."""
    return RedirectResponse(url="/status", status_code=302)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    from fastapi import HTTPException

    from app.db.session import get_engine

    try:
        with get_engine().connect() as c:
            c.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        logger.exception("health_db check failed")
        raise HTTPException(status_code=503, detail="Database unavailable") from exc
    return {"status": "ok", "database": True}


@app.get("/status", response_class=HTMLResponse, tags=["health"])
def status_dashboard():
    """Browser-friendly view of API + PostgreSQL connectivity."""
    from app.db.session import get_engine

    db_ok = False
    db_detail = ""
    try:
        with get_engine().connect() as c:
            c.execute(text("SELECT 1"))
        db_ok = True
        db_detail = "PostgreSQL responded to SELECT 1."
    except Exception as exc:  # noqa: BLE001
        s = get_settings()
        if (s.ENVIRONMENT or "development").lower() in ("production", "prod"):
            logger.exception("status dashboard db check failed")
            db_detail = html.escape("Database connection failed.")
        else:
            db_detail = html.escape(str(exc)[:2000])

    badge_ok = "background:#bef264;color:#0a0a0a;"
    badge_bad = "background:#fecaca;color:#450a0a;"
    api_badge = f'<span style="display:inline-block;padding:0.25rem 0.6rem;border-radius:9999px;font-weight:700;{badge_ok}">OK</span>'
    db_badge = (
        f'<span style="display:inline-block;padding:0.25rem 0.6rem;border-radius:9999px;font-weight:700;{badge_ok}">Connected</span>'
        if db_ok
        else f'<span style="display:inline-block;padding:0.25rem 0.6rem;border-radius:9999px;font-weight:700;{badge_bad}">Error</span>'
    )
    body = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HirKaar API — Status</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 0; background: #f5f5ef; color: #171717; }}
    main {{ max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem; }}
    h1 {{ font-size: 1.5rem; margin: 0 0 0.5rem; }}
    p.sub {{ color: #525252; font-size: 0.9rem; margin: 0 0 1.5rem; }}
    section {{ background: #fff; border: 1px solid #e5e5e5; border-radius: 1rem; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }}
    .row {{ display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }}
    .label {{ font-weight: 700; }}
    pre {{ margin: 0.75rem 0 0; font-size: 0.75rem; white-space: pre-wrap; word-break: break-word; background: #fafafa; border-radius: 0.5rem; padding: 0.75rem; border: 1px solid #eee; }}
    a {{ color: #171717; font-weight: 600; }}
  </style>
</head>
<body>
  <main>
    <h1>HirKaar API</h1>
    <p class="sub">Live status · JSON: <a href="/health">/health</a> · <a href="/health/db">/health/db</a></p>
    <section>
      <div class="row">
        <span class="label">API process</span>
        {api_badge}
      </div>
      <p style="margin:0.75rem 0 0;font-size:0.875rem;color:#525252;">HTTP server is running.</p>
    </section>
    <section>
      <div class="row">
        <span class="label">Database</span>
        {db_badge}
      </div>
      <p style="margin:0.75rem 0 0;font-size:0.875rem;color:#525252;">{html.escape(db_detail) if db_ok else ""}</p>
      {"<pre>" + db_detail + "</pre>" if not db_ok else ""}
    </section>
  </main>
</body>
</html>"""
    return HTMLResponse(content=body)


@app.get("/v1/meta")
def meta():
    return {
        "market": "in_drive_style_skilled_labour",
        "primary_country": "PK",
        "platform_fee_rate": get_settings().PLATFORM_FEE_RATE,
    }
