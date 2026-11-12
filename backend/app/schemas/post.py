from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime


MAX_POST_LENGTH = 1000
MAX_MEDIA_PER_POST = 5


# ── Media ────────────────────────────────────────────────────────────────────

class PostMediaResponse(BaseModel):
    id: int
    cloudinary_url: str
    media_type: str
    order: int

    model_config = ConfigDict(from_attributes=True)


# ── Post ─────────────────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    content: str | None = None

    @field_validator("content")
    @classmethod
    def content_not_empty_string(cls, v: str | None) -> str | None:
        if v is not None and v.strip() == "":
            return None
        if v is not None and len(v) > MAX_POST_LENGTH:
            raise ValueError(f"Post content cannot exceed {MAX_POST_LENGTH} characters.")
        return v


class PostAuthorResponse(BaseModel):
    username: str
    full_name: str
    profile_picture: str | None = None
    course: str | None = None
    branch: str | None = None
    year: str | None = None
    is_alumni: bool = False
    is_id_verified: bool = False
    linkedin_url: str | None = None

    model_config = ConfigDict(from_attributes=True)


class PostResponse(BaseModel):
    id: int
    content: str | None
    media: list[PostMediaResponse]
    author: PostAuthorResponse
    like_count: int
    comment_count: int
    is_liked_by_me: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PostUpdate(BaseModel):
    content: str | None = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str | None) -> str | None:
        if v is not None and v.strip() == "":
            return None
        if v is not None and len(v) > MAX_POST_LENGTH:
            raise ValueError(f"Post content cannot exceed {MAX_POST_LENGTH} characters.")
        return v


class PaginatedPostsResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class PostReportCreate(BaseModel):
    reason: str
    details: str | None = None


class PostReportResponse(BaseModel):
    message: str
    reported: bool
    is_quarantined: bool


class TrendingTopicResponse(BaseModel):
    tag: str
    post_count: int
    category: str
    is_active: bool

