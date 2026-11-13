from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime


class MessageCreate(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        if len(v) > 2000:
            raise ValueError("Message cannot exceed 2000 characters.")
        return v


class MessageStart(BaseModel):
    message: str | None = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    receiver_id: int
    content: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationParticipant(BaseModel):
    id: int
    username: str
    full_name: str
    profile_picture: str | None = None
    course: str | None = None
    branch: str | None = None
    year: str | None = None
    is_alumni: bool = False
    is_id_verified: bool = False
    is_following: bool = False

    model_config = ConfigDict(from_attributes=True)


class LastMessageResponse(BaseModel):
    id: int
    sender_id: int
    content: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: int
    participant: ConversationParticipant
    last_message: LastMessageResponse | None = None
    unread_count: int = 0
    created_at: datetime
    last_message_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    unread_count: int
