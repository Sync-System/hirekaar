from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User, WorkerWallet
from app.schemas import LoginIn, RegisterIn, TokenOut
from app.serialize import user_to_out

router = APIRouter(prefix="/auth", tags=["auth"])


def _norm_phone(p: str) -> str:
    """Digits-only identity for MVP (Pakistan-first; extend for E.164 worldwide)."""
    return "".join(c for c in p if c.isdigit())


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    phone = _norm_phone(body.phone)
    exists = db.execute(select(User).where(User.phone == phone)).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="Phone already registered")

    user = User(
        phone=phone,
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip(),
        role=body.role,
        country="PK",
        profile_completed=False,
    )
    db.add(user)
    db.flush()
    if body.role == "worker":
        db.add(WorkerWallet(user_id=user.id, balance_minor=0))
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), {"role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user_to_out(user, db)}


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    phone = _norm_phone(body.phone)
    user = db.execute(select(User).where(User.phone == phone)).scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    token = create_access_token(str(user.id), {"role": user.role})
    return TokenOut(access_token=token)
