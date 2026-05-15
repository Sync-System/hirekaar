from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, WalletLedger, WorkerWallet
from app.schemas import BoostIn, TopUpIn

router = APIRouter(prefix="/wallet", tags=["wallet"])


def _wallet(db: Session, user_id) -> WorkerWallet:
    w = db.get(WorkerWallet, user_id)
    if not w:
        w = WorkerWallet(user_id=user_id, balance_minor=0)
        db.add(w)
        db.flush()
    return w


@router.get("/me")
def wallet_me(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "worker":
        raise HTTPException(status_code=403, detail="Wallet is for workers")
    w = _wallet(db, user.id)
    return {"balance_minor": w.balance_minor}


@router.post("/topup")
def topup(
    body: TopUpIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "worker":
        raise HTTPException(status_code=403, detail="Wallet is for workers")
    s = get_settings()
    if not s.ALLOW_WALLET_DEMO_TOPUP:
        raise HTTPException(
            status_code=403,
            detail="Wallet demo top-up is disabled. Set ALLOW_WALLET_DEMO_TOPUP=true only in trusted non-production environments.",
        )
    w = _wallet(db, user.id)
    w.balance_minor += body.amount_minor
    db.add(
        WalletLedger(
            user_id=user.id,
            amount_minor=body.amount_minor,
            entry_type="topup",
            note="Demo top-up — replace with payment gateway",
        )
    )
    db.add(w)
    db.commit()
    return {"balance_minor": w.balance_minor}


@router.post("/boost")
def boost(
    body: BoostIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "worker":
        raise HTTPException(status_code=403, detail="Boost is for workers")
    s = get_settings()
    cost = body.days * s.BOOST_PRICE_PER_DAY_MINOR
    w = _wallet(db, user.id)
    if w.balance_minor < cost:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance — top up first")
    w.balance_minor -= cost
    now = datetime.now(UTC)
    base = user.featured_until or now
    if base < now:
        base = now
    user.featured_until = base + timedelta(days=body.days)
    db.add(
        WalletLedger(
            user_id=user.id,
            amount_minor=-cost,
            entry_type="boost",
            note=f"Featured listing {body.days}d",
        )
    )
    db.add(w)
    db.add(user)
    db.commit()
    return {"featured_until": user.featured_until.isoformat(), "balance_minor": w.balance_minor}
