import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from app.core.config import settings
from app.utils.moderation import assert_safe_image

# Supported file types
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES

MAX_IMAGE_SIZE_MB = 10
MAX_VIDEO_SIZE_MB = 50


def configure_cloudinary():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )


def upload_media(file: UploadFile, folder: str = "campusconnect/posts") -> dict:
    """
    Uploads a file to Cloudinary.
    Returns a dict with:
        - url          : secure CDN URL
        - public_id    : used to delete the asset later
        - media_type   : "image" or "video"
    """
    configure_cloudinary()

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{file.content_type}'. Allowed: JPEG, PNG, WEBP, GIF, MP4, MOV, WEBM."
        )

    is_video = file.content_type in ALLOWED_VIDEO_TYPES
    max_mb = MAX_VIDEO_SIZE_MB if is_video else MAX_IMAGE_SIZE_MB
    resource_type = "video" if is_video else "image"

    # Read the file bytes and enforce size limit
    contents = file.file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > max_mb:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum allowed size is {max_mb} MB."
        )

    # Visual AI content moderation: detect 18+ explicit nudity before uploading
    if file.content_type in ALLOWED_IMAGE_TYPES:
        assert_safe_image(contents, file.filename or "Image")

    try:
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type=resource_type,
            # For images: auto quality + format optimization (saves bandwidth)
            quality="auto",
            fetch_format="auto",
        )

        # Check if Cloudinary moderation flagged this asset
        moderation_info = result.get("moderation")
        if moderation_info:
            for mod in moderation_info:
                if mod.get("status") == "rejected":
                    try:
                        cloudinary.uploader.destroy(result["public_id"], resource_type=resource_type)
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=400,
                        detail="Media rejected: File violates CampusConnect safety guidelines (explicit or prohibited content detected)."
                    )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Media upload failed: {str(e)}")

    return {
        "url": result["secure_url"],
        "public_id": result["public_id"],
        "media_type": "video" if is_video else "image",
    }


def delete_media(public_id: str, media_type: str = "image"):
    """Deletes a Cloudinary asset by public_id."""
    configure_cloudinary()
    resource_type = "video" if media_type == "video" else "image"
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    except Exception:
        pass  # Best-effort deletion; don't crash if Cloudinary is unreachable
