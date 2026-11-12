import re
import os
import tempfile
from fastapi import HTTPException

# Comprehensive dictionary of abusive, vulgar, and cuss words in Hindi/Hinglish
HINDI_EXPLICIT_WORDS = {
    # Genitalia / Sexual anatomy
    "chut", "choot", "chuut", "chute",
    "lund", "lond", "loda", "lauda", "lowda", "lode", "lowde", "lawde", "lavda", "lavde", "lundtop",
    "gaand", "gand", "gandu", "gaandu", "gandoo", "gandfat", "gandfati", "gandwe",
    "bhosda", "bhosada", "bhosdi", "bhosdee", "bhosdike", "bhosdika", "bhosdiwala", "bhosdiwale", "bhosadchod", "bhosadi",
    "tatte", "tatta", "jhat", "jhaat", "jhaatu", "jhatu",

    # Abusive slurs & insults
    "raand", "randi", "raandi", "randwa", "randwe", "randbaaz", "randibaaz", "chinal", "chinnal",
    "chutiya", "chutiye", "chutye", "chutya", "chutiyapa", "chutmarika", "chutmarike",
    "madarchod", "madarchodh", "maderchod", "madarxhod", "madrchod", "madarchodo",
    "behenchod", "bhenchod", "bhenchodd", "behanchod", "bhenchodon", "bhenkelode", "bhenkeloda",
    "harami", "haraami", "harramzada", "haramzada", "haramzade", "haramkhor",
    "kameena", "kamina", "kamine", "kameene", "kamini",
    "kutta", "kutti", "kutiya", "kutte", "kutto",
    "suar", "bhadva", "bhadwa", "bhadwe", "hijra", "hijda", "chhakka",
    "saala", "saale",

    # Sexual acts & vulgar verbs
    "chod", "choda", "chodna", "chodne", "chudo", "chudai", "chudwana", "chudvaye", "chudaye", "chudao", "chudwao",
    "chus", "chuso", "chusna", "chusta", "chusti", "chuste",
    "muth", "mutth", "muthal", "mutthal",
}

# Comprehensive dictionary of English vulgarities, curses, adult and hate terms
ENGLISH_EXPLICIT_WORDS = {
    # Pornographic & adult explicit terms
    "porn", "porno", "pornography", "xxx", "nsfw", "hentai", "nude", "nudes",
    "nudity", "naked", "sex", "sexy", "boobs", "tits", "vagina", "penis",
    "cock", "dick", "pussy", "asshole", "blowjob", "handjob", "cum", "masturbate",
    "masturbation", "erotic", "stripper", "hardcore", "milf", "dildo", "slut",
    "whore", "escort", "onlyfans", "leakeds", "camgirl", "incest",

    # Swearing, profanity & curses
    "fuck", "fucker", "fucking", "fucked", "fuckoff", "motherfucker", "motherfucking", "fuckhead", "fucks",
    "bitch", "bitches", "bitching", "bitchy",
    "cunt", "cunts",
    "dickhead", "dicks", "cockhead", "cocksucker",
    "assholes", "dumbass", "jackass", "dipshit", "shithead", "bullshit", "shitty",
    "bastard", "bastards",
    "deepthroat", "threesome", "gangbang",

    # Slurs
    "nigger", "nigga", "faggot", "retard",
}

ALL_EXPLICIT_WORDS = HINDI_EXPLICIT_WORDS | ENGLISH_EXPLICIT_WORDS

# Unambiguous stems that should be detected even inside concatenated usernames or handles
UNAMBIGUOUS_STEMS = [
    "chut", "choot", "raand", "randi", "bhosd", "madarchod", "behenchod", "bhenchod",
    "lauda", "lowde", "lawde", "gaandu", "gandfat", "chutiya",
    "motherfuck", "asshole", "cocksuck", "dickhead", "cunt", "nigger", "faggot",
]

# Regex to normalize obfuscated text:
# Replaces leetspeak: 0->o, 1->i, @->a, $->s, 3->e, etc.
LEET_MAP = str.maketrans({
    "0": "o", "1": "i", "!": "i", "@": "a", "3": "e", "$": "s", "5": "s", "7": "t", "4": "a"
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
    Scans text for profanity, abusive cuss words (Hindi / English),
    and 18+ explicit, adult, or pornographic content.
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

    # Step 4: Tokenize words by alphanumeric boundaries (handles underscores, spaces, hyphens, dots)
    tokens = set(re.findall(r"[a-z0-9]+", deobfuscated))

    for token in tokens:
        if token in ALL_EXPLICIT_WORDS:
            return True, token
        # Check repeated characters (e.g. chuuuut -> chut, fuuuuck -> fuck)
        collapsed = re.sub(r"(.)\1{2,}", r"\1", token)
        if collapsed in ALL_EXPLICIT_WORDS:
            return True, collapsed

    # Step 5: Check condensed text without spaces or separators (e.g. "chut_ka_saudagar", "ankurraand")
    condensed = re.sub(r"[\s\-_.*+~#@/\\|]+", "", deobfuscated)
    for stem in UNAMBIGUOUS_STEMS:
        if stem in condensed:
            return True, stem

    return False, None


def assert_safe_content(text: str | None, content_type: str = "Post") -> None:
    """
    Validates that content does not violate community guidelines (no cuss words, abusive language, or 18+ explicit content).
    Raises HTTPException 400 if explicit or abusive content is found.
    """
    flagged, match = is_explicit_text(text)
    if flagged:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{content_type} rejected: Content violates CampusConnect community guidelines "
                "(profanity, abusive language, or 18+ explicit content is strictly not permitted on this campus network)."
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

