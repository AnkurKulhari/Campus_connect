from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.schemas.message import (
    MessageCreate, MessageStart, MessageResponse,
    ConversationResponse, UnreadCountResponse
)
from app.schemas.auth import MessageResponse as BasicMessageResponse
from app.services.message_service import (
    list_conversations, get_conversation_messages,
    send_message, start_conversation_with_user,
    get_total_unread_count, block_user, unblock_user,
    delete_message
)

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve total count of unread incoming messages across all conversations."""
    count = get_total_unread_count(current_user, db)
    return {"unread_count": count}


@router.get("/conversations", response_model=list[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all active 1-on-1 conversations for current user, ordered by last activity."""
    return list_conversations(current_user, db)


@router.get("/conversations/{conversation_id}", response_model=list[MessageResponse])
def get_messages(
    conversation_id: int,
    limit: int = Query(default=100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all messages in a conversation and mark incoming messages as read."""
    return get_conversation_messages(conversation_id, current_user, db, limit)


@router.post("/conversations/{conversation_id}", response_model=MessageResponse, status_code=201)
def post_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a new message in an existing conversation."""
    return send_message(conversation_id, payload.content, current_user, db)


@router.post("/start/{username}", response_model=ConversationResponse)
def start_conversation(
    username: str,
    payload: MessageStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start or retrieve conversation with a given username, optionally sending an initial message."""
    return start_conversation_with_user(username, payload.message, current_user, db)


@router.post("/block/{username}", response_model=BasicMessageResponse)
def block(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Block a user from messaging you."""
    return block_user(username, current_user, db)


@router.delete("/block/{username}", response_model=BasicMessageResponse)
def unblock(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unblock a user."""
    return unblock_user(username, current_user, db)


@router.delete("/{message_id}", response_model=BasicMessageResponse)
def delete_chat_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unsend / delete a message sent by the current user."""
    return delete_message(message_id, current_user, db)
