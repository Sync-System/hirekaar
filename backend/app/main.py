from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import admin, auth, jobs, public, reviews, users, wallet

app = FastAPI(title="HirKaar API", version="0.2.0")

s = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in s.CORS_ORIGINS.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(jobs.router)
app.include_router(wallet.router)
app.include_router(admin.router)
app.include_router(reviews.router)
app.include_router(public.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    from fastapi import HTTPException
    from sqlalchemy import text

    from app.db.session import get_engine

    try:
        with get_engine().connect() as c:
            c.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "ok", "database": True}


@app.get("/v1/meta")
def meta():
    return {
        "market": "in_drive_style_skilled_labour",
        "primary_country": "PK",
        "platform_fee_rate": get_settings().PLATFORM_FEE_RATE,
    }
