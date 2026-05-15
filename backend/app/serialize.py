from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User, WorkerSkill
from app.schemas import UserOut


def _worker_skills(db: Session, user_id) -> list[str]:
    rows = db.execute(select(WorkerSkill.skill).where(WorkerSkill.user_id == user_id)).scalars().all()
    return list(rows)


def user_to_out(u: User, db: Session | None = None) -> UserOut:
    avg = 0.0
    if u.rating_count and int(u.rating_count) > 0:
        avg = float(u.rating_sum) / int(u.rating_count)
    skills: list[str] = []
    if db is not None and u.role == "worker":
        skills = _worker_skills(db, u.id)
    return UserOut(
        id=u.id,
        phone=u.phone,
        full_name=u.full_name,
        role=u.role,
        country=u.country,
        city=u.city,
        profile_completed=u.profile_completed,
        avatar_url=u.avatar_url,
        cnic_number=u.cnic_number,
        cnic_photo_url=u.cnic_photo_url,
        is_worker_available=u.is_worker_available,
        featured_until=u.featured_until,
        rating_avg=round(avg, 2),
        created_at=u.created_at,
        skills=skills,
    )
