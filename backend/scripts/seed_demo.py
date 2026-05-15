"""Create demo users in Postgres (run inside API container).

  docker compose exec api python scripts/seed_demo.py

Uses the same env as the API (`DATABASE_URL` or `POSTGRES_*` — see root `.env.example`).
Refuses to run when ENVIRONMENT=production unless ALLOW_DEMO_SEED=1.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

_root = Path(__file__).resolve().parents[1]
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

if os.environ.get("ENVIRONMENT", "development").lower() in ("production", "prod"):
    if os.environ.get("ALLOW_DEMO_SEED", "").strip().lower() not in ("1", "true", "yes"):
        print(
            "Refusing seed_demo: ENVIRONMENT is production. Set ALLOW_DEMO_SEED=1 to override.",
            file=sys.stderr,
        )
        sys.exit(1)

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import delete, select

from app.core.security import hash_password
from app.db.session import get_session_factory
from app.models import User, WorkerSkill, WorkerWallet

DEMO_PASSWORD = "Demo1234!"


def sync_worker_skills(db, user_id, skills: list[str]) -> None:
    db.execute(delete(WorkerSkill).where(WorkerSkill.user_id == user_id))
    for s in skills:
        db.add(WorkerSkill(user_id=user_id, skill=s))


def upsert_user(
    db,
    *,
    phone: str,
    full_name: str,
    role: str,
    with_wallet: bool = False,
    skills: list[str] | None = None,
) -> None:
    row = db.execute(select(User).where(User.phone == phone)).scalar_one_or_none()
    if row:
        row.password_hash = hash_password(DEMO_PASSWORD)
        row.full_name = full_name
        row.role = role
        row.country = "PK"
        row.city = "karachi"
        row.profile_completed = True
        if role == "worker":
            row.cnic_number = row.cnic_number or "4220123456789"
            row.cnic_photo_url = row.cnic_photo_url or "https://example.com/cnic-demo.jpg"
        else:
            row.cnic_number = None
            row.cnic_photo_url = None
        u = row
    else:
        u = User(
            phone=phone,
            password_hash=hash_password(DEMO_PASSWORD),
            full_name=full_name,
            role=role,
            country="PK",
            city="karachi",
            profile_completed=True,
            cnic_number="4220123456789" if role == "worker" else None,
            cnic_photo_url="https://example.com/cnic-demo.jpg" if role == "worker" else None,
        )
        db.add(u)
    db.flush()
    if role == "worker" and skills:
        sync_worker_skills(db, u.id, skills)
    if with_wallet or role == "worker":
        if not db.get(WorkerWallet, u.id):
            db.add(WorkerWallet(user_id=u.id, balance_minor=50_000))
    if role == "worker":
        # Karachi area demo pin so customers can test "nearby" without a real device.
        u.last_lat = Decimal("24.8607")
        u.last_lng = Decimal("67.0011")
        u.location_updated_at = datetime.now(UTC)
    db.add(u)


def main() -> None:
    Session = get_session_factory()
    db = Session()
    try:
        upsert_user(db, phone="03000000001", full_name="Demo Customer", role="customer")
        upsert_user(
            db,
            phone="03000000002",
            full_name="Demo Worker",
            role="worker",
            with_wallet=True,
            skills=["electrician", "plumber"],
        )
        upsert_user(db, phone="03000000000", full_name="Demo Admin", role="admin")
        db.commit()
        print("Seeded demo users:")
        print("  admin    03000000000  /", DEMO_PASSWORD)
        print("  customer 03000000001 /", DEMO_PASSWORD)
        print("  worker   03000000002  /", DEMO_PASSWORD)
    finally:
        db.close()


if __name__ == "__main__":
    main()
