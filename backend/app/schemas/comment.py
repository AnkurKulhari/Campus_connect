from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from app.models.comment import MAX_COMMENT_LENGTH


class CommentCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Comment cannot be empty.")
        if len(v) > MAX_COMMENT_LENGTH:
            raise ValueError(f"Comment cannot exceed {MAX_COMMENT_LENGTH} characters.")
        return v


class CommentUpdate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Comment cannot be empty.")
        if len(v) > MAX_COMMENT_LENGTH:
            raise ValueError(f"Comment cannot exceed {MAX_COMMENT_LENGTH} characters.")
        return v


class CommentAuthorResponse(BaseModel):
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


class CommentResponse(BaseModel):
    id: int
    content: str
    author: CommentAuthorResponse
    post_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedCommentsResponse(BaseModel):
    comments: list[CommentResponse]
    total: int
    page: int
    page_size: int
    has_next: bool


class LikeToggleResponse(BaseModel):
    message: str
    liked: bool
    like_count: int
