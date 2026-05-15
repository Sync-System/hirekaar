from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.deps import get_current_user
from app.models import Bid, Job, JobLiveLocation, User, WalletLedger, WorkerWallet
from app.profile_completion import refresh_profile_completed, worker_profile_block_detail
from app.schemas import BidCreateIn, JobCreateIn, JobSiteIn, JobTrackingIn

router = APIRouter(prefix="/jobs", tags=["jobs"])


def _require_customer(user: User) -> None:
    if user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can do this")


def _require_worker(user: User) -> None:
    if user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can do this")


def _assigned_worker_id(db: Session, job: Job) -> UUID | None:
    if not job.accepted_bid_id:
        return None
    bid = db.get(Bid, job.accepted_bid_id)
    return bid.worker_id if bid else None


def _clear_job_tracking(db: Session, job_id: UUID) -> None:
    db.execute(delete(JobLiveLocation).where(JobLiveLocation.job_id == job_id))


def _rating_avg(u: User) -> float:
    if u.rating_count and int(u.rating_count) > 0:
        return round(float(u.rating_sum) / int(u.rating_count), 2)
    return 0.0


def _assigned_worker_profile(db: Session, job: Job) -> dict | None:
    wid = _assigned_worker_id(db, job)
    if wid is None:
        return None
    worker = db.get(User, wid)
    if not worker:
        return None
    return {
        "id": str(worker.id),
        "full_name": worker.full_name,
        "rating_avg": _rating_avg(worker),
        "rating_count": int(worker.rating_count or 0),
        "avatar_url": worker.avatar_url,
    }


def _recommended_price(db: Session, job: Job) -> int:
    """Market-ish recommendation: same city/category accepted prices, fallback to budget midpoint."""
    avg = db.scalar(
        select(func.avg(Job.accepted_price_minor)).where(
            Job.category == job.category,
            Job.city == job.city,
            Job.accepted_price_minor.is_not(None),
        )
    )
    if avg is not None:
        market = int(round(float(avg)))
    else:
        market = int(round((job.budget_min + job.budget_max) / 2))
    return max(job.budget_min, min(job.budget_max, market))


def _job_card(db: Session, job: Job, bid: Bid | None = None) -> dict:
    aw = _assigned_worker_id(db, job)
    return {
        "id": str(job.id),
        "customer_id": str(job.customer_id),
        "assigned_worker_id": str(aw) if aw else None,
        "assigned_worker": _assigned_worker_profile(db, job),
        "title": job.title,
        "description": job.description,
        "category": job.category,
        "country": job.country,
        "city": job.city,
        "area": job.area,
        "budget_min": job.budget_min,
        "budget_max": job.budget_max,
        "recommended_price": _recommended_price(db, job),
        "status": job.status,
        "accepted_bid_id": str(job.accepted_bid_id) if job.accepted_bid_id else None,
        "accepted_price_minor": job.accepted_price_minor,
        "platform_fee_minor": job.platform_fee_minor,
        "created_at": job.created_at.isoformat(),
        "request_expires_at": (job.created_at + timedelta(seconds=30)).isoformat(),
        "bid": None
        if bid is None
        else {
            "id": str(bid.id),
            "amount": bid.amount,
            "message": bid.message,
            "eta": bid.eta,
            "status": bid.status,
            "created_at": bid.created_at.isoformat(),
        },
    }


@router.get("")
def list_jobs(
    db: Session = Depends(get_db),
    country: str | None = None,
    city: str | None = None,
    status: str | None = "open",
):
    q = select(Job).order_by(Job.created_at.desc())
    if country:
        q = q.where(Job.country == country.upper())
    if city:
        q = q.where(Job.city == city.lower())
    if status:
        q = q.where(Job.status == status)
    rows = db.execute(q).scalars().all()
    return [_job_card(db, j) for j in rows]


@router.get("/me")
def my_jobs(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role == "customer":
        rows = db.execute(
            select(Job).where(Job.customer_id == user.id).order_by(Job.created_at.desc())
        ).scalars().all()
        return {"role": "customer", "jobs": [_job_card(db, j) for j in rows]}
    if user.role == "worker":
        rows = db.execute(
            select(Job, Bid)
            .join(Bid, Bid.job_id == Job.id)
            .where(Bid.worker_id == user.id)
            .order_by(Bid.created_at.desc())
        ).all()
        return {"role": "worker", "jobs": [_job_card(db, j, b) for j, b in rows]}
    rows = db.execute(select(Job).order_by(Job.created_at.desc()).limit(100)).scalars().all()
    return {"role": "admin", "jobs": [_job_card(db, j) for j in rows]}


@router.post("")
def create_job(
    body: JobCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_customer(user)
    refresh_profile_completed(db, user)
    if not user.profile_completed:
        raise HTTPException(status_code=400, detail="Complete your profile first (add country and city)")
    if body.budget_max < body.budget_min:
        raise HTTPException(status_code=400, detail="Invalid budget range")
    s = get_settings()
    site_lat = Decimal(str(body.site_lat)) if body.site_lat is not None else None
    site_lng = Decimal(str(body.site_lng)) if body.site_lng is not None else None
    if (site_lat is None) ^ (site_lng is None):
        raise HTTPException(status_code=400, detail="Provide both site_lat and site_lng, or neither")
    job = Job(
        customer_id=user.id,
        title=body.title.strip(),
        description=body.description.strip(),
        category=body.category.strip().lower(),
        country=(body.country or "PK").upper(),
        city=body.city.strip().lower(),
        area=body.area.strip(),
        budget_min=body.budget_min,
        budget_max=body.budget_max,
        scheduled_at=body.scheduled_at,
        platform_fee_rate=Decimal(str(s.PLATFORM_FEE_RATE)),
        site_lat=site_lat,
        site_lng=site_lng,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return {"id": str(job.id)}


@router.get("/{job_id}/tracking")
def get_job_tracking(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Customer + assigned worker only. Active while job status is `in_progress`."""
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "in_progress":
        raise HTTPException(status_code=400, detail="Live map is only available while the job is in progress")
    wid = _assigned_worker_id(db, job)
    if wid is None:
        raise HTTPException(status_code=400, detail="No assigned worker on this job")
    if user.id != job.customer_id and user.id != wid:
        raise HTTPException(status_code=403, detail="Not allowed to view this job's tracking")
    def site_dict() -> dict:
        return {
            "site_lat": float(job.site_lat) if job.site_lat is not None else None,
            "site_lng": float(job.site_lng) if job.site_lng is not None else None,
        }

    row = db.get(JobLiveLocation, job_id)
    if not row:
        return {
            "lat": None,
            "lng": None,
            "updated_at": None,
            "worker_id": str(wid),
            **site_dict(),
        }
    return {
        "lat": float(row.lat),
        "lng": float(row.lng),
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "worker_id": str(row.worker_id),
        **site_dict(),
    }


@router.post("/{job_id}/tracking")
def post_job_tracking(
    job_id: UUID,
    body: JobTrackingIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Assigned worker pushes GPS updates for this job only (InDrive-style moving pin)."""
    _require_worker(user)
    job = db.get(Job, job_id)
    if not job or job.status != "in_progress":
        raise HTTPException(status_code=400, detail="Tracking only while job is in progress")
    wid = _assigned_worker_id(db, job)
    if wid is None or wid != user.id:
        raise HTTPException(status_code=403, detail="You are not the assigned worker for this job")
    row = db.get(JobLiveLocation, job_id)
    now = datetime.now(UTC)
    if row:
        row.lat = Decimal(str(body.lat))
        row.lng = Decimal(str(body.lng))
        row.updated_at = now
        row.worker_id = user.id
        db.add(row)
    else:
        db.add(
            JobLiveLocation(
                job_id=job_id,
                worker_id=user.id,
                lat=Decimal(str(body.lat)),
                lng=Decimal(str(body.lng)),
                updated_at=now,
            )
        )
    db.commit()
    return {"ok": True}


@router.patch("/{job_id}/site")
def patch_job_site(
    job_id: UUID,
    body: JobSiteIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Customer sets or updates the job-site GPS pin (used on the live map + driving route)."""
    _require_customer(user)
    job = db.get(Job, job_id)
    if not job or job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    if job.status not in ("open", "in_progress"):
        raise HTTPException(status_code=400, detail="Job site can only be set while the job is open or in progress")
    job.site_lat = Decimal(str(body.lat))
    job.site_lng = Decimal(str(body.lng))
    db.add(job)
    db.commit()
    return {"ok": True, "site_lat": float(job.site_lat), "site_lng": float(job.site_lng)}


@router.get("/{job_id}")
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    bids = db.execute(select(Bid).where(Bid.job_id == job_id).order_by(Bid.created_at.desc())).scalars().all()
    aw = _assigned_worker_id(db, job)
    return {
        "id": str(job.id),
        "customer_id": str(job.customer_id),
        "assigned_worker_id": str(aw) if aw else None,
        "assigned_worker": _assigned_worker_profile(db, job),
        "title": job.title,
        "description": job.description,
        "category": job.category,
        "country": job.country,
        "city": job.city,
        "area": job.area,
        "budget_min": job.budget_min,
        "budget_max": job.budget_max,
        "recommended_price": _recommended_price(db, job),
        "status": job.status,
        "accepted_bid_id": str(job.accepted_bid_id) if job.accepted_bid_id else None,
        "accepted_price_minor": job.accepted_price_minor,
        "platform_fee_minor": job.platform_fee_minor,
        "site_lat": float(job.site_lat) if job.site_lat is not None else None,
        "site_lng": float(job.site_lng) if job.site_lng is not None else None,
        "created_at": job.created_at.isoformat(),
        "bids": [
            {
                "id": str(b.id),
                "worker_id": str(b.worker_id),
                "amount": b.amount,
                "message": b.message,
                "eta": b.eta,
                "status": b.status,
                "created_at": b.created_at.isoformat(),
            }
            for b in bids
        ],
    }


@router.post("/{job_id}/bids")
def create_bid(
    job_id: UUID,
    body: BidCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_worker(user)
    refresh_profile_completed(db, user)
    if not user.profile_completed:
        raise HTTPException(status_code=400, detail=worker_profile_block_detail(db, user))
    job = db.get(Job, job_id)
    if not job or job.status != "open":
        raise HTTPException(status_code=400, detail="Job not open for bids")
    exists = db.execute(
        select(Bid).where(Bid.job_id == job_id, Bid.worker_id == user.id)
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="You already bid on this job")
    bid = Bid(job_id=job_id, worker_id=user.id, amount=body.amount, message=body.message, eta=body.eta)
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return {"id": str(bid.id)}


@router.post("/{job_id}/accept/{bid_id}")
def accept_bid(
    job_id: UUID,
    bid_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_customer(user)
    job = db.execute(select(Job).where(Job.id == job_id).with_for_update()).scalar_one_or_none()
    if not job or job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Job not open")
    bid = db.get(Bid, bid_id)
    if not bid or bid.job_id != job_id or bid.status != "pending":
        raise HTTPException(status_code=400, detail="Invalid bid")

    fee_rate = float(job.platform_fee_rate or Decimal("0.1"))
    fee_minor = int(round(bid.amount * fee_rate))
    price_minor = bid.amount

    db.execute(
        update(Bid).where(Bid.job_id == job_id, Bid.id != bid_id, Bid.status == "pending").values(status="rejected")
    )
    bid.status = "accepted"
    job.accepted_bid_id = bid.id
    job.accepted_price_minor = price_minor
    job.platform_fee_minor = fee_minor
    job.status = "in_progress"

    w = db.get(WorkerWallet, bid.worker_id)
    if not w:
        w = WorkerWallet(user_id=bid.worker_id, balance_minor=0)
        db.add(w)
        db.flush()
    w.balance_minor -= fee_minor
    db.add(
        WalletLedger(
            user_id=bid.worker_id,
            amount_minor=-fee_minor,
            entry_type="platform_fee",
            job_id=job.id,
            bid_id=bid.id,
            note="Platform fee on accepted bid",
        )
    )
    db.add(w)
    db.add(bid)
    db.add(job)
    db.commit()
    return {"ok": True, "platform_fee_minor": fee_minor, "accepted_price_minor": price_minor}


@router.post("/{job_id}/complete")
def complete_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    wid = _assigned_worker_id(db, job)
    is_customer_owner = user.role == "customer" and job.customer_id == user.id
    is_assigned_worker = user.role == "worker" and wid == user.id
    if not is_customer_owner and not is_assigned_worker:
        raise HTTPException(status_code=403, detail="Not your job")
    if job.status != "in_progress":
        raise HTTPException(status_code=400, detail="Job must be in progress")
    job.status = "completed"
    _clear_job_tracking(db, job_id)
    db.add(job)
    db.commit()
    return {"ok": True, "completed_by": user.role, "assigned_worker": _assigned_worker_profile(db, job)}


@router.post("/{job_id}/cancel")
def cancel_job(
    job_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _require_customer(user)
    job = db.get(Job, job_id)
    if not job or job.customer_id != user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    if job.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Cannot cancel")
    _clear_job_tracking(db, job_id)
    job.status = "cancelled"
    db.add(job)
    db.commit()
    return {"ok": True}
