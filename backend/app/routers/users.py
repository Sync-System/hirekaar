from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, WorkerSkill
from app.profile_completion import refresh_profile_completed
from app.schemas import ProfilePatchIn, SkillsIn, UserOut, WorkerLocationIn
from app.serialize import user_to_out

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserOut:
    return user_to_out(user, db)


@router.patch("/me", response_model=UserOut)
def patch_me(
    body: ProfilePatchIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    if body.country is not None:
        user.country = body.country.upper()
    if body.city is not None:
        user.city = body.city.strip().lower() or None
    if body.avatar_url is not None:
        user.avatar_url = body.avatar_url.strip() or None
    if body.cnic_number is not None:
        user.cnic_number = body.cnic_number.strip() or None
    if body.cnic_photo_url is not None:
        user.cnic_photo_url = body.cnic_photo_url.strip() or None
    if body.is_worker_available is not None and user.role == "worker":
        user.is_worker_available = body.is_worker_available
    refresh_profile_completed(db, user)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_out(user, db)


@router.patch("/me/location", response_model=UserOut)
def patch_worker_location(
    body: WorkerLocationIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    """Workers push last known coordinates (browser GPS). Customers use /public/workers-nearby to search."""
    if user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can update map location")
    user.last_lat = Decimal(str(body.lat))
    user.last_lng = Decimal(str(body.lng))
    user.location_updated_at = datetime.now(UTC)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_out(user, db)


@router.put("/me/skills", response_model=UserOut)
def put_skills(
    body: SkillsIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserOut:
    if user.role != "worker":
        raise HTTPException(status_code=400, detail="Only workers have skills")
    cleaned = [(s or "").strip().lower() for s in body.skills[:32] if (s or "").strip()]
    if not cleaned:
        raise HTTPException(status_code=400, detail="Select at least one skill")
    db.execute(delete(WorkerSkill).where(WorkerSkill.user_id == user.id))
    for skill in cleaned:
        db.add(WorkerSkill(user_id=user.id, skill=skill))
    refresh_profile_completed(db, user)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user_to_out(user, db)
