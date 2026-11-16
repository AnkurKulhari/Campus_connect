from pydantic import BaseModel, ConfigDict


class FollowToggleResponse(BaseModel):
    message: str
    is_following: bool
    followers_count: int


class FollowerRemoveResponse(BaseModel):
    status: str
    message: str
    followers_count: int
    removed_user_id: int


class FollowUserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    profile_picture: str | None = None
    bio: str | None = None
    is_following: bool = False
    is_followed_by: bool = False
    is_self: bool = False

    model_config = ConfigDict(from_attributes=True)


class PaginatedFollowUsersResponse(BaseModel):
    users: list[FollowUserResponse]
    total: int
    page: int
    page_size: int
    has_next: bool
