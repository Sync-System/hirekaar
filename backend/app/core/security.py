import hashlib
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.core.config import get_settings


def _password_bytes(raw: str) -> bytes:
    """Bcrypt accepts at most 72 bytes; hash first so long / Unicode passwords are safe."""
    return hashlib.sha256(raw.encode("utf-8")).digest()


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(_password_bytes(raw), bcrypt.gensalt(rounds=12)).decode("ascii")


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(raw), hashed.encode("ascii"))
    except ValueError:
        return False


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    s = get_settings()
    expire = datetime.now(UTC) + timedelta(minutes=s.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {"sub": subject, "exp": expire}
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, s.JWT_SECRET, algorithm=s.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    s = get_settings()
    return jwt.decode(token, s.JWT_SECRET, algorithms=[s.JWT_ALGORITHM])


def parse_uuid_sub(payload: dict[str, Any]) -> UUID:
    sub = payload.get("sub")
    if not sub:
        raise JWTError("missing sub")
    return UUID(str(sub))
