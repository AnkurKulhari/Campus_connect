from pydantic import BaseModel, ConfigDict
from datetime import datetime


class UserProfileResponse(BaseModel):
    id: int
    username: str
    full_name: str
    bio: str | None = None
    profile_picture: str | None = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    is_following: bool = False
    is_self: bool = False
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: str | None = None
    bio: str | None = None
    profile_picture: str | None = None
