import re
from collections import Counter
from fastapi import HTTPException, UploadFile, BackgroundTasks
from sqlalchemy.orm import Session, selectinload, with_expression
from sqlalchemy import select, func

from app.models.post import Post, PostMedia
from app.models.like import Like
from app.models.comment import Comment
from app.models.follow import Follow
from app.models.user import User
from app.models.report import PostReport
from app.schemas.post import PostCreate, PostUpdate, PostReportCreate, MAX_MEDIA_PER_POST
from app.utils.cloudinary import upload_media, delete_media
from app.utils.moderation import assert_safe_content


def _post_options(current_user_id: int) -> list:
    like_count_subq = (
        select(func.count(Like.id))
        .where(Like.post_id == Post.id)
        .correlate(Post)
        .scalar_subquery()
    )
    comment_count_subq = (
        select(func.count(Comment.id))
        .where(Comment.post_id == Post.id)
        .correlate(Post)
        .scalar_subquery()
    )
    is_liked_subq = (
        select(func.count(Like.id))
        .where(Like.post_id == Post.id, Like.user_id == current_user_id)
        .correlate(Post)
        .scalar_subquery()
    )

    return [
        selectinload(Post.media),
        selectinload(Post.author),
        with_expression(Post.like_count, like_count_subq),
        with_expression(Post.comment_count, comment_count_subq),
        with_expression(Post.is_liked_by_me, is_liked_subq),
    ]


def _get_post_or_404(post_id: int, current_user_id: int, db: Session) -> Post:
    post = db.scalar(
        select(Post)
        .options(*_post_options(current_user_id))
        .where(Post.id == post_id)
    )
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    return post


def _require_post_owner(post: Post, current_user: User):
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only modify your own posts.")


# ── Create ────────────────────────────────────────────────────────────────────

def create_post(
    post_data: PostCreate,
    files: list[UploadFile],
    current_user: User,
    db: Session,
) -> Post:
    # Alumni posting restriction: Alumni can browse, like, and comment, but cannot publish new posts
    if current_user.is_alumni or (current_user.year and current_user.year.strip().lower() == "alumni"):
        raise HTTPException(
            status_code=403,
            detail="Alumni accounts have read-only browsing access and cannot publish new posts. Connect with students and explore the campus feed!"
        )

    if not post_data.content and not files:
        raise HTTPException(status_code=400, detail="A post must have text content or at least one media file.")

    # Disallow posts that consist solely of hashtags without any message or media
    if not files and post_data.content:
        import re
        text_without_tags = re.sub(r"#\w+", "", post_data.content).strip()
        if not text_without_tags:
            raise HTTPException(
                status_code=400,
                detail="A post cannot consist only of hashtags. Please add a message, question, or discussion context."
            )

    if len(files) > MAX_MEDIA_PER_POST:
        raise HTTPException(status_code=400, detail=f"You can attach at most {MAX_MEDIA_PER_POST} files per post.")

    # Content moderation check for 18+ explicit content
    assert_safe_content(post_data.content, "Post")

    # Idempotency Guard: prevent duplicate posts from double-clicks or client timeout retries
    if post_data.content and post_data.content.strip():
        from datetime import timedelta
        recent_duplicate = db.scalar(
            select(Post)
            .where(
                Post.user_id == current_user.id,
                Post.content == post_data.content.strip(),
                Post.created_at >= datetime.now(UTC) - timedelta(seconds=60),
            )
            .order_by(Post.created_at.desc())
        )
        if recent_duplicate:
            return _get_post_or_404(recent_duplicate.id, current_user.id, db)

    post = Post(user_id=current_user.id, content=post_data.content)
    db.add(post)
    db.flush()

    valid_files = [f for f in files if f.filename]
    if len(valid_files) > 1:
        from concurrent.futures import ThreadPoolExecutor

        def _upload_single(f_idx_tuple):
            idx, file = f_idx_tuple
            uploaded = upload_media(file)
            return (
                idx,
                uploaded["url"],
                uploaded["public_id"],
                uploaded["media_type"],
            )

        with ThreadPoolExecutor(max_workers=min(len(valid_files), 4)) as executor:
            results = list(executor.map(_upload_single, list(enumerate(valid_files))))

        for idx, url, public_id, media_type in results:
            media = PostMedia(
                post_id=post.id,
                cloudinary_url=url,
                cloudinary_public_id=public_id,
                media_type=media_type,
                order=idx,
            )
            db.add(media)
    elif len(valid_files) == 1:
        file = valid_files[0]
        uploaded = upload_media(file)
        media = PostMedia(
            post_id=post.id,
            cloudinary_url=uploaded["url"],
            cloudinary_public_id=uploaded["public_id"],
            media_type=uploaded["media_type"],
            order=0,
        )
        db.add(media)

    db.commit()
    return _get_post_or_404(post.id, current_user.id, db)


# ── Read ──────────────────────────────────────────────────────────────────────

def get_post(post_id: int, current_user_id: int, db: Session) -> Post:
    return _get_post_or_404(post_id, current_user_id, db)


def get_feed(
    page: int,
    page_size: int,
    current_user_id: int,
    db: Session,
    tag: str | None = None,
) -> dict:
    offset = (page - 1) * page_size
    query = (
        select(Post)
        .options(*_post_options(current_user_id))
        .where(Post.is_hidden == False)
    )
    count_query = select(func.count(Post.id)).where(Post.is_hidden == False)

    if tag:
        tag_clean = tag.strip().lstrip("#")
        tag_pattern = f"%{tag_clean}%"
        query = query.where(Post.content.ilike(tag_pattern))
        count_query = count_query.where(Post.content.ilike(tag_pattern))

    total = db.scalar(count_query) or 0
    posts = db.scalars(
        query.order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    return {
        "posts": posts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + page_size) < total,
    }


def get_trending_topics(db: Session, limit: int = 6) -> list[dict]:
    """
    Computes real trending topics and hashtags from active posts in the database.
    Ranks by frequency and post volume.
    """
    posts = db.scalars(
        select(Post.content)
        .where(Post.is_hidden == False, Post.content.isnot(None))
        .order_by(Post.created_at.desc())
        .limit(300)
    ).all()

    tag_regex = re.compile(r"#([A-Za-z0-9_]{2,30})")
    counts = Counter()
    case_map: dict[str, str] = {}

    for content in posts:
        if not content:
            continue
        tags = set(tag_regex.findall(content))
        for t in tags:
            t_lower = t.lower()
            counts[t_lower] += 1
            if t_lower not in case_map:
                case_map[t_lower] = t
            elif t[0].isupper() and not case_map[t_lower][0].isupper():
                case_map[t_lower] = t

    def infer_category(tag_lower: str) -> str:
        if any(k in tag_lower for k in ["code", "hack", "dev", "tech", "ai", "ml", "python", "java", "algo", "web"]):
            return "Coding"
        if any(k in tag_lower for k in ["placement", "job", "intern", "career", "interview", "hire", "tpo"]):
            return "Career"
        if any(k in tag_lower for k in ["exam", "aktu", "sem", "result", "study", "syllabus", "notes"]):
            return "Academics"
        if any(k in tag_lower for k in ["fest", "event", "freshers", "farewell", "sports", "cultural"]):
            return "Event"
        if any(k in tag_lower for k in ["csi", "dsc", "club", "society", "ieee"]):
            return "Society"
        return "Campus"

    results: list[dict] = []

    for t_lower, count in counts.most_common(limit):
        display_tag = case_map.get(t_lower, t_lower)
        results.append({
            "tag": display_tag,
            "post_count": count,
            "category": infer_category(t_lower),
            "is_active": True,
        })

    if len(results) < limit:
        campus_defaults = [
            ("Placements2026", "Career"),
            ("SmartIndiaHackathon", "Coding"),
            ("SemesterExams", "Academics"),
            ("IPEC_CSI", "Society"),
            ("TechFest2026", "Event"),
            ("CampusLife", "Campus"),
        ]
        existing_tags = {r["tag"].lower() for r in results}
        for def_tag, def_cat in campus_defaults:
            if def_tag.lower() not in existing_tags:
                actual_count = sum(
                    1 for c in posts if c and (f"#{def_tag.lower()}" in c.lower() or def_tag.lower() in c.lower())
                )
                results.append({
                    "tag": def_tag,
                    "post_count": actual_count,
                    "category": def_cat,
                    "is_active": actual_count > 0,
                })
                if len(results) >= limit:
                    break

    return results


def get_following_feed(page: int, page_size: int, current_user_id: int, db: Session) -> dict:
    offset = (page - 1) * page_size
    following_subq = select(Follow.following_id).where(Follow.follower_id == current_user_id)

    total = db.scalar(
        select(func.count(Post.id)).where(
            Post.user_id.in_(following_subq),
            Post.is_hidden == False,
        )
    ) or 0

    posts = db.scalars(
        select(Post)
        .options(*_post_options(current_user_id))
        .where(
            Post.user_id.in_(following_subq),
            Post.is_hidden == False,
        )
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    return {
        "posts": posts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + page_size) < total,
    }


def get_user_posts(username: str, page: int, page_size: int, current_user_id: int, db: Session) -> dict:
    user = db.scalar(select(User).where(User.username == username))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    offset = (page - 1) * page_size
    total = db.scalar(
        select(func.count(Post.id)).where(
            Post.user_id == user.id,
            Post.is_hidden == False,
        )
    ) or 0

    posts = db.scalars(
        select(Post)
        .options(*_post_options(current_user_id))
        .where(
            Post.user_id == user.id,
            Post.is_hidden == False,
        )
        .order_by(Post.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    return {
        "posts": posts,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (offset + page_size) < total,
    }


# ── Update ────────────────────────────────────────────────────────────────────

def update_post(post_id: int, post_data: PostUpdate, current_user: User, db: Session) -> Post:
    post = _get_post_or_404(post_id, current_user.id, db)
    _require_post_owner(post, current_user)

    if post_data.content is not None:
        assert_safe_content(post_data.content, "Post")
        post.content = post_data.content

    if not post.content and not post.media:
        raise HTTPException(status_code=400, detail="A post must have text content or at least one media file.")

    db.commit()
    return _get_post_or_404(post_id, current_user.id, db)


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_post(post_id: int, current_user: User, background_tasks: BackgroundTasks, db: Session):
    post = _get_post_or_404(post_id, current_user.id, db)
    _require_post_owner(post, current_user)

    for media in post.media:
        background_tasks.add_task(delete_media, media.cloudinary_public_id, media.media_type)

    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully."}


# ── Report / Quarantine ───────────────────────────────────────────────────────

QUARANTINE_REPORT_THRESHOLD = 2  # Once 2 peers report, post is hidden from campus feeds


def report_post(
    post_id: int,
    report_data: PostReportCreate,
    current_user: User,
    db: Session,
) -> dict:
    post = db.scalar(select(Post).where(Post.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    if post.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot report your own post.")

    # Guard against duplicate reports from the same user
    existing = db.scalar(
        select(PostReport).where(
            PostReport.post_id == post_id,
            PostReport.user_id == current_user.id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="You have already reported this post. Our team has recorded it."
        )

    # Record report
    report = PostReport(
        post_id=post_id,
        user_id=current_user.id,
        reason=report_data.reason,
        details=report_data.details,
    )
    db.add(report)

    post.report_count += 1
    if post.report_count >= QUARANTINE_REPORT_THRESHOLD:
        post.is_hidden = True

    db.commit()

    return {
        "message": (
            "Thank you for reporting. This post has been removed from your feed and flagged for review."
            if post.is_hidden
            else "Thank you for reporting. Your feedback has been recorded."
        ),
        "reported": True,
        "is_quarantined": post.is_hidden,
    }
