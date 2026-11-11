import re
import os
import tempfile
from fastapi import HTTPException

# Normalized patterns and keywords associated with 18+ adult/explicit content
EXPLICIT_KEYWORDS = {
    # Pornographic & adult explicit terms
    "porn", "porno", "pornography", "xxx", "nsfw", "hentai", "nude", "nudes",
    "nudity", "naked", "sex", "sexy", "boobs", "tits", "vagina", "penis",
    "cock", "dick", "pussy", "asshole", "blowjob", "handjob", "cum", "masturbate",
    "masturbation", "erotic", "stripper", "hardcore", "milf", "dildo", "slut",
    "whore", "escort", "onlyfans", "leakeds", "camgirl", "incest",
}

# Regex to normalize obfuscated text:
# Replaces leetspeak: 0->o, 1->i, @->a, $->s, 3->e, etc.
LEET_MAP = str.maketrans({
    "0": "o", "1": "i", "!": "i", "@": "a", "3": "e", "$": "s", "5": "s", "7": "t"
})

# Lazy-loaded NudeNet detector
_nude_detector = None

EXPLICIT_IMAGE_CLASSES = {
    "FEMALE_GENITALIA_EXPOSED",
    "FEMALE_BREAST_EXPOSED",
    "BUTTOCKS_EXPOSED",
    "MALE_GENITALIA_EXPOSED",
    "ANUS_EXPOSED",
}


def get_nude_detector():
    """Lazy loads NudeNet YOLOv8 ONNX model once."""
    global _nude_detector
    if _nude_detector is None:
        try:
            from nudenet import NudeDetector
            _nude_detector = NudeDetector()
        except Exception:
            _nude_detector = False
    return _nude_detector


def is_explicit_text(text: str | None) -> tuple[bool, str | None]:
    """
    Scans text for 18+ explicit, adult, or pornographic content.
    Returns (is_explicit, matched_word).
    """
    if not text or not text.strip():
        return False, None

    # Step 1: Clean and lowercase
    raw = text.lower()

    # Step 2: Remove zero-width spaces and non-printable characters
    cleaned = re.sub(r"[\u200B-\u200D\uFEFF]", "", raw)

    # Step 3: De-obfuscate leetspeak
    deobfuscated = cleaned.translate(LEET_MAP)

    # Tokenize words using alphanumeric characters
    words = set(re.findall(r"\b[a-z]{3,}\b", deobfuscated))

    for word in words:
        if word in EXPLICIT_KEYWORDS:
            return True, word

    # Step 4: Check condensed text without spaces (e.g. "p o r n" or "p_o_r_n")
    condensed = re.sub(r"[\s\-_.*+~#@]+", "", deobfuscated)
    for kw in ["porn", "nsfw", "hentai", "blowjob", "onlyfans"]:
        if kw in condensed:
            return True, kw

    return False, None


def assert_safe_content(text: str | None, content_type: str = "Post") -> None:
    """
    Validates that content does not violate 18+ adult content guidelines.
    Raises HTTPException 400 if explicit content is found.
    """
    flagged, match = is_explicit_text(text)
    if flagged:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{content_type} rejected: Content violates CampusConnect community "
                "guidelines (18+ explicit or adult content is not permitted on this campus network)."
            ),
        )


def is_explicit_image(image_bytes: bytes, threshold: float = 0.40) -> tuple[bool, str | None, float | None]:
    """
    Runs local ONNX visual model to detect 18+ explicit nudity in image bytes.
    Returns (is_explicit, detected_class, confidence_score).
    """
    if not image_bytes:
        return False, None, None

    detector = get_nude_detector()
    if not detector:
        return False, None, None

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as temp_file:
        temp_file.write(image_bytes)
        temp_file.flush()
        temp_path = temp_file.name

    try:
        detections = detector.detect(temp_path)
        for item in detections:
            cls = item.get("class")
            score = float(item.get("score", 0.0))
            if cls in EXPLICIT_IMAGE_CLASSES and score >= threshold:
                return True, cls, score
        return False, None, None
    except Exception:
        return False, None, None
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


def assert_safe_image(image_bytes: bytes, filename: str = "Image") -> None:
    """
    Scans image bytes for 18+ explicit nudity before cloud upload.
    Raises HTTPException 400 if explicit nudity is detected.
    """
    is_explicit, cls, score = is_explicit_image(image_bytes)
    if is_explicit:
        cls_clean = cls.replace("_", " ").lower() if cls else "explicit content"
        raise HTTPException(
            status_code=400,
            detail=(
                f"Photo rejected: '{filename}' contains 18+ explicit or adult content ({cls_clean}). "
                "Uploading adult or sexually explicit media is strictly prohibited on CampusConnect."
            ),
        )

