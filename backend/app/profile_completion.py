from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import User, WorkerSkill


def _worker_completion(db: Session, u: User) -> tuple[bool, list[str]]:
    gaps: list[str] = []
    if not (u.country or "").strip():
        gaps.append("country")
    if not (u.city or "").strip():
        gaps.append("city")
    if not (u.cnic_number or "").strip():
        gaps.append("CNIC number")
    if not (u.cnic_photo_url or "").strip():
        gaps.append("CNIC photo URL")
    n = db.scalar(select(func.count()).select_from(WorkerSkill).where(WorkerSkill.user_id == u.id)) or 0
    if n == 0:
        gaps.append("at least one skill")
    return (len(gaps) == 0, gaps)


def refresh_profile_completed(db: Session, u: User) -> None:
    if u.role == "admin":
        u.profile_completed = True
        return
    if u.role == "customer":
        u.profile_completed = bool((u.country or "").strip() and (u.city or "").strip())
        return
    ok, _ = _worker_completion(db, u)
    u.profile_completed = ok


def worker_profile_block_detail(db: Session, u: User) -> str:
    _, gaps = _worker_completion(db, u)
    if not gaps:
        return "Complete your profile first"
    return "Complete your profile first — still need: " + ", ".join(gaps)
