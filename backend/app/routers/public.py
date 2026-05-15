from collections import defaultdict
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.geo import haversine_km
from app.models import User, WorkerSkill

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/featured-workers")
def featured_workers(db: Session = Depends(get_db)):
    now = datetime.now(UTC)
    rows = db.execute(
        select(User)
        .where(User.role == "worker", User.featured_until.is_not(None), User.featured_until > now)
        .order_by(User.rating_count.desc())
        .limit(12)
    ).scalars().all()
    out = []
    for u in rows:
        avg = 0.0
        if u.rating_count and int(u.rating_count) > 0:
            avg = float(u.rating_sum) / int(u.rating_count)
        out.append(
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "city": u.city,
                "country": u.country,
                "rating_avg": round(avg, 2),
                "featured_until": u.featured_until.isoformat() if u.featured_until else None,
            }
        )
    return out


@router.get("/workers-nearby")
def workers_nearby(
    db: Session = Depends(get_db),
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
    city: str | None = Query(None, description="Fallback: list available workers in this city (no GPS)"),
    radius_km: float = Query(15, ge=0.5, le=80),
    limit: int = Query(24, ge=1, le=60),
    stale_minutes: int = Query(30, ge=5, le=180, description="Ignore worker locations older than this"),
):
    """
    InDrive-style nearby discovery.

    - **lat + lng**: rank workers by straight-line distance (km) who recently shared location.
    - **city** only: workers in that city (no distance) — useful before GPS permission.
    """
    now = datetime.now(UTC)
    cutoff = now - timedelta(minutes=stale_minutes)

    base = select(User).where(
        User.role == "worker",
        User.profile_completed.is_(True),
        User.is_worker_available.is_(True),
    )

    if lat is not None and lng is not None:
        rows = db.execute(
            base.where(
                User.last_lat.is_not(None),
                User.last_lng.is_not(None),
                User.location_updated_at.is_not(None),
                User.location_updated_at >= cutoff,
            )
        ).scalars().all()
        scored: list[tuple[User, float]] = []
        for u in rows:
            d = haversine_km(lat, lng, float(u.last_lat or 0), float(u.last_lng or 0))
            if d <= radius_km:
                scored.append((u, d))
        scored.sort(key=lambda x: (x[1], -int(x[0].rating_count or 0)))
        rows = [t[0] for t in scored[:limit]]
        distances = {str(u.id): round(d, 2) for u, d in scored[:limit]}
    elif city:
        c = city.strip().lower()
        rows = db.execute(
            base.where(User.city == c).order_by(User.rating_count.desc()).limit(limit)
        ).scalars().all()
        distances = {}
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide lat and lng for nearby map search, or city= for same-city list",
        )

    if not rows:
        return []

    ids = [u.id for u in rows]
    skill_rows = db.execute(select(WorkerSkill).where(WorkerSkill.user_id.in_(ids))).scalars().all()
    by_user: dict[str, list[str]] = defaultdict(list)
    for s in skill_rows:
        by_user[str(s.user_id)].append(s.skill)

    out = []
    for u in rows:
        avg = 0.0
        if u.rating_count and int(u.rating_count) > 0:
            avg = float(u.rating_sum) / int(u.rating_count)
        uid = str(u.id)
        item: dict = {
            "id": uid,
            "full_name": u.full_name,
            "city": u.city,
            "country": u.country,
            "rating_avg": round(avg, 2),
            "skills": by_user.get(uid, []),
        }
        if uid in distances:
            item["distance_km"] = distances[uid]
        if u.location_updated_at:
            item["location_updated_at"] = u.location_updated_at.isoformat()
        out.append(item)
    return out
