from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user
from app.models import Bid, Job, User

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    n_users = db.scalar(select(func.count()).select_from(User)) or 0
    n_jobs = db.scalar(select(func.count()).select_from(Job)) or 0
    n_bids = db.scalar(select(func.count()).select_from(Bid)) or 0
    return {"users": n_users, "jobs": n_jobs, "bids": n_bids}


@router.get("/users")
def admin_users(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = 50,
):
    _require_admin(user)
    rows = db.execute(select(User).order_by(User.created_at.desc()).limit(min(limit, 200))).scalars().all()
    return [
        {
            "id": str(u.id),
            "phone": u.phone,
            "full_name": u.full_name,
            "role": u.role,
            "country": u.country,
            "city": u.city,
            "profile_completed": u.profile_completed,
            "created_at": u.created_at.isoformat(),
        }
        for u in rows
    ]


@router.get("/workers/featured")
def admin_featured_preview(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_admin(user)
    now = datetime.now(UTC)
    rows = db.execute(
        select(User)
        .where(User.role == "worker", User.featured_until.is_not(None), User.featured_until > now)
        .order_by(User.featured_until.desc())
        .limit(50)
    ).scalars().all()
    return [{"id": str(u.id), "full_name": u.full_name, "featured_until": u.featured_until.isoformat() if u.featured_until else None} for u in rows]
