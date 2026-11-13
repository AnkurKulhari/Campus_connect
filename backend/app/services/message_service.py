from datetime import datetime, UTC
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_, and_

from app.models.user import User
from app.models.message import Conversation, Message, BlockedUser
from app.models.follow import Follow
from app.utils.moderation import assert_safe_content


def _is_blocked(user1_id: int, user2_id: int, db: Session) -> bool:
    """Check if either user has blocked the other."""
    blocked = db.scalar(
        select(BlockedUser.id).where(
            or_(
                and_(BlockedUser.blocker_id == user1_id, BlockedUser.blocked_id == user2_id),
                and_(BlockedUser.blocker_id == user2_id, BlockedUser.blocked_id == user1_id),
            )
        )
    )
    return bool(blocked)


def get_or_create_conversation(user_a_id: int, user_b_id: int, db: Session) -> Conversation:
    if user_a_id == user_b_id:
        raise HTTPException(status_code=400, detail="Cannot create conversation with yourself.")

    u1, u2 = min(user_a_id, user_b_id), max(user_a_id, user_b_id)
    conv = db.scalar(
        select(Conversation).where(
            Conversation.user1_id == u1,
            Conversation.user2_id == u2,
        )
    )
    if not conv:
        conv = Conversation(user1_id=u1, user2_id=u2, last_message_at=datetime.now(UTC))
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


def list_conversations(current_user: User, db: Session) -> list[dict]:
    conversations = db.scalars(
        select(Conversation)
        .where(
            or_(
                Conversation.user1_id == current_user.id,
                Conversation.user2_id == current_user.id,
            )
        )
        .order_by(Conversation.last_message_at.desc())
    ).all()

    result = []
    for conv in conversations:
        other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        other_user = db.scalar(select(User).where(User.id == other_user_id))
        if not other_user:
            continue

        # Check if current_user follows other_user
        is_following_participant = db.scalar(
            select(Follow.id).where(
                Follow.follower_id == current_user.id,
                Follow.following_id == other_user.id,
            )
        ) is not None

        last_msg = db.scalar(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(1)
        )

        unread_count = db.scalar(
            select(func.count(Message.id)).where(
                Message.conversation_id == conv.id,
                Message.receiver_id == current_user.id,
                Message.is_read == False,
            )
        ) or 0

        result.append({
            "id": conv.id,
            "participant": {
                "id": other_user.id,
                "username": other_user.username,
                "full_name": other_user.full_name,
                "profile_picture": other_user.profile_picture,
                "course": other_user.course,
                "branch": other_user.branch,
                "year": other_user.year,
                "is_alumni": other_user.is_alumni,
                "is_id_verified": other_user.is_id_verified,
                "is_following": is_following_participant,
            },
            "last_message": {
                "id": last_msg.id,
                "sender_id": last_msg.sender_id,
                "content": last_msg.content,
                "is_read": last_msg.is_read,
                "created_at": last_msg.created_at,
            } if last_msg else None,
            "unread_count": unread_count,
            "created_at": conv.created_at,
            "last_message_at": conv.last_message_at,
        })

    return result


def get_conversation_messages(conversation_id: int, current_user: User, db: Session, limit: int = 100) -> list[Message]:
    conv = db.scalar(select(Conversation).where(Conversation.id == conversation_id))
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if current_user.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation.")

    # Mark incoming unread messages as read
    unread_messages = db.scalars(
        select(Message).where(
            Message.conversation_id == conv.id,
            Message.receiver_id == current_user.id,
            Message.is_read == False,
        )
    ).all()

    if unread_messages:
        for msg in unread_messages:
            msg.is_read = True
        db.commit()

    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    ).all()

    return list(messages)


def send_message(conversation_id: int, content: str, current_user: User, db: Session) -> Message:
    conv = db.scalar(select(Conversation).where(Conversation.id == conversation_id))
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    if current_user.id not in (conv.user1_id, conv.user2_id):
        raise HTTPException(status_code=403, detail="You are not a participant in this conversation.")

    receiver_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id

    if _is_blocked(current_user.id, receiver_id, db):
        raise HTTPException(status_code=403, detail="Cannot send message. One of the users has blocked communications.")

    assert_safe_content(content, "Message")

    new_msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        receiver_id=receiver_id,
        content=content.strip(),
        is_read=False,
    )
    db.add(new_msg)

    conv.last_message_at = datetime.now(UTC)
    db.commit()
    db.refresh(new_msg)
    return new_msg


def start_conversation_with_user(username: str, initial_message: str | None, current_user: User, db: Session) -> dict:
    target_user = db.scalar(select(User).where(User.username == username))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot start a conversation with yourself.")

    if _is_blocked(current_user.id, target_user.id, db):
        raise HTTPException(status_code=403, detail="Cannot message this user.")

    # Check if a conversation already exists
    u1, u2 = min(current_user.id, target_user.id), max(current_user.id, target_user.id)
    existing_conv = db.scalar(
        select(Conversation.id).where(
            Conversation.user1_id == u1,
            Conversation.user2_id == u2,
        )
    )

    is_following_target = db.scalar(
        select(Follow.id).where(
            Follow.follower_id == current_user.id,
            Follow.following_id == target_user.id,
        )
    ) is not None

    is_followed_by_target = db.scalar(
        select(Follow.id).where(
            Follow.follower_id == target_user.id,
            Follow.following_id == current_user.id,
        )
    ) is not None

    # Anti-Spam DM Gate: New conversations require follow connection
    if not existing_conv and not (is_following_target or is_followed_by_target):
        raise HTTPException(
            status_code=403,
            detail=f"You must follow @{username} to send them a direct message."
        )

    conv = get_or_create_conversation(current_user.id, target_user.id, db)

    last_msg = None
    if initial_message and initial_message.strip():
        last_msg = send_message(conv.id, initial_message.strip(), current_user, db)

    return {
        "id": conv.id,
        "participant": {
            "id": target_user.id,
            "username": target_user.username,
            "full_name": target_user.full_name,
            "profile_picture": target_user.profile_picture,
            "course": target_user.course,
            "branch": target_user.branch,
            "year": target_user.year,
            "is_alumni": target_user.is_alumni,
            "is_id_verified": target_user.is_id_verified,
            "is_following": is_following_target,
        },
        "last_message": {
            "id": last_msg.id,
            "sender_id": last_msg.sender_id,
            "content": last_msg.content,
            "is_read": last_msg.is_read,
            "created_at": last_msg.created_at,
        } if last_msg else None,
        "unread_count": 0,
        "created_at": conv.created_at,
        "last_message_at": conv.last_message_at,
    }


def get_total_unread_count(current_user: User, db: Session) -> int:
    count = db.scalar(
        select(func.count(Message.id)).where(
            Message.receiver_id == current_user.id,
            Message.is_read == False,
        )
    )
    return count or 0


def block_user(username: str, current_user: User, db: Session):
    target_user = db.scalar(select(User).where(User.username == username))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself.")

    existing = db.scalar(
        select(BlockedUser).where(
            BlockedUser.blocker_id == current_user.id,
            BlockedUser.blocked_id == target_user.id,
        )
    )
    if not existing:
        new_block = BlockedUser(blocker_id=current_user.id, blocked_id=target_user.id)
        db.add(new_block)
        db.commit()
    return {"message": f"@{username} has been blocked."}


def unblock_user(username: str, current_user: User, db: Session):
    target_user = db.scalar(select(User).where(User.username == username))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    block_entry = db.scalar(
        select(BlockedUser).where(
            BlockedUser.blocker_id == current_user.id,
            BlockedUser.blocked_id == target_user.id,
        )
    )
    if block_entry:
        db.delete(block_entry)
        db.commit()
    return {"message": f"@{username} has been unblocked."}
