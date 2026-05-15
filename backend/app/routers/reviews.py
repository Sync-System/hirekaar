from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps import get_current_user
from app.models import Bid, Job, Review, User
from app.schemas import ReviewCreateIn

router = APIRouter(prefix="/reviews", tags=["reviews"])


def _assigned_worker_id(db: Session, job: Job) -> UUID | None:
    if not job.accepted_bid_id:
        return None
    bid = db.get(Bid, job.accepted_bid_id)
    return bid.worker_id if bid else None


@router.get("/job/{job_id}")
def my_review_for_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Customer: whether this customer already left a review for this job."""
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can query this")
    job = db.get(Job, job_id)
    if not job or job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    r = db.execute(
        select(Review).where(Review.job_id == job_id, Review.reviewer_id == user.id)
    ).scalar_one_or_none()
    if not r:
        return {"review": None}
    return {
        "review": {
            "id": str(r.id),
            "rating": r.rating,
            "comment": r.comment,
        }
    }


@router.post("/{job_id}")
def create_review(
    job_id: UUID,
    body: ReviewCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers leave job reviews")
    job = db.get(Job, job_id)
    if not job or job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    if job.status != "completed":
        raise HTTPException(status_code=400, detail="Job must be completed")
    if body.reviewee_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot review yourself")
    existing = db.execute(
        select(Review).where(Review.job_id == job_id, Review.reviewer_id == user.id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="You already reviewed this job")
    wid = _assigned_worker_id(db, job)
    if wid is None or wid != body.reviewee_id:
        raise HTTPException(status_code=400, detail="You can only rate the professional who did this job")
    reviewee = db.get(User, body.reviewee_id)
    if not reviewee or reviewee.role != "worker":
        raise HTTPException(status_code=400, detail="Invalid reviewee")
    r = Review(
        job_id=job_id,
        reviewer_id=user.id,
        reviewee_id=body.reviewee_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(r)
    reviewee.rating_sum = Decimal(reviewee.rating_sum or 0) + Decimal(body.rating)
    reviewee.rating_count = int(reviewee.rating_count or 0) + 1
    db.add(reviewee)
    db.commit()
    db.refresh(r)
    return {"id": str(r.id)}
