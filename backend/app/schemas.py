from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RegisterIn(BaseModel):
    phone: str = Field(..., min_length=8, max_length=20)
    full_name: str = Field(..., min_length=1, max_length=120)
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., pattern="^(customer|worker)$")


class LoginIn(BaseModel):
    phone: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    phone: str
    full_name: str
    role: str
    country: str
    city: str | None
    profile_completed: bool
    avatar_url: str | None
    cnic_number: str | None
    cnic_photo_url: str | None
    is_worker_available: bool
    featured_until: datetime | None
    rating_avg: float
    created_at: datetime
    skills: list[str] = Field(default_factory=list, max_length=32)


class ProfilePatchIn(BaseModel):
    country: str | None = Field(None, min_length=2, max_length=2)
    city: str | None = None
    avatar_url: str | None = None
    cnic_number: str | None = Field(None, max_length=20)
    cnic_photo_url: str | None = None
    is_worker_available: bool | None = None


class SkillsIn(BaseModel):
    skills: list[str] = Field(default_factory=list, max_length=32)


class JobCreateIn(BaseModel):
    title: str
    description: str
    category: str
    country: str = "PK"
    city: str
    area: str
    budget_min: int
    budget_max: int
    scheduled_at: datetime | None = None
    site_lat: float | None = Field(None, ge=-90, le=90)
    site_lng: float | None = Field(None, ge=-180, le=180)


class JobSiteIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class BidCreateIn(BaseModel):
    amount: int = Field(..., ge=0)
    message: str | None = None
    eta: str | None = None


class ReviewCreateIn(BaseModel):
    reviewee_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class TopUpIn(BaseModel):
    amount_minor: int = Field(..., gt=0, description="PKR whole amount (same unit as bids)")


class BoostIn(BaseModel):
    days: int = Field(..., ge=1, le=30)


class WorkerLocationIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class JobTrackingIn(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
