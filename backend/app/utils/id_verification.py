import io
import re
import difflib
import logging
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)

IPEC_COLLEGE_KEYWORDS = {
    "inderprastha", "engineering", "college", "ipec",
    "aktu", "identity", "card", "student", "admn", "admission",
    "ghaziabad", "dr.", "abdul", "kalam", "technical", "university",
    "autonomous", "institution", "fee", "receipt", "tuition", "accounts",
    "fees", "challan", "slip", "session"
}


def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extracts text from an image using pytesseract if available.
    Applies image preprocessing (grayscale, contrast, sharpening) to optimize OCR accuracy.
    """
    try:
        import pytesseract
    except ImportError:
        logger.warning("pytesseract is not installed; OCR extraction unavailable.")
        return ""

    try:
        image = Image.open(io.BytesIO(image_bytes))

        # Convert RGBA or Palette to RGB
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Resize if image is extremely large to prevent OOM and speed up OCR
        max_dim = 2000
        if max(image.size) > max_dim:
            image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

        # First OCR attempt on standard image
        text = pytesseract.image_to_string(image)
        if len(text.strip()) >= 15:
            return text

        # Second attempt: Preprocess with grayscale + high contrast
        gray = image.convert("L")
        enhanced = ImageEnhance.Contrast(gray).enhance(2.0)
        enhanced = enhanced.filter(ImageFilter.SHARPEN)
        text_enhanced = pytesseract.image_to_string(enhanced)

        return text_enhanced if len(text_enhanced) > len(text) else text
    except Exception as e:
        err_str = str(e).lower()
        if "tesseract is not installed" in err_str or "no such file or directory: 'tesseract'" in err_str:
            logger.warning("Tesseract binary not found on system PATH. OCR check bypassed.")
            return "__TESSERACT_NOT_AVAILABLE__"
        logger.error(f"Error during ID card OCR: {e}")
        return ""


def verify_id_card_name(
    image_bytes: bytes,
    full_name: str,
    roll_number: str | None = None
) -> tuple[bool, str]:
    """
    Verifies that the uploaded ID card photo matches the student's claimed Full Name.
    Returns (is_valid, reason_message).
    """
    if not image_bytes:
        return False, "No ID card image provided."

    extracted_text = extract_text_from_image(image_bytes)

    # If tesseract binary is not installed on this host environment (e.g. dev machine without tesseract),
    # log warning and allow upload rather than hard crashing the server
    if extracted_text == "__TESSERACT_NOT_AVAILABLE__":
        logger.warning("Host environment lacks Tesseract binary. Allowing upload for manual admin review.")
        return True, "ID uploaded (host OCR bypassed)"

    cleaned_ocr = re.sub(r"[^a-z0-9\s]", " ", extracted_text.lower())
    ocr_words = set(cleaned_ocr.split())

    # If OCR extracted virtually no text (e.g., blurry, pitch black, or corrupt image)
    if len(ocr_words) < 3:
        return False, (
            "Unable to read text from your ID card photo. "
            "Please upload a clear, well-lit, and unblurred photo of your college ID card."
        )

    # Prepare student's name tokens (min length 2 characters)
    name_clean = re.sub(r"[^a-z\s]", " ", full_name.lower())
    name_tokens = [t for t in name_clean.split() if len(t) >= 2]

    if not name_tokens:
        return False, "Invalid full name provided."

    # 1. Check exact full name match in OCR text
    if " ".join(name_tokens) in cleaned_ocr:
        return True, "Full name verified on ID card."

    # 2. Check individual name tokens
    matched_name_tokens = []
    for token in name_tokens:
        if token in ocr_words or token in cleaned_ocr:
            matched_name_tokens.append(token)
        else:
            # Fuzzy match for minor OCR scanning character variations
            for ocr_w in ocr_words:
                if len(token) >= 4 and len(ocr_w) >= 4:
                    ratio = difflib.SequenceMatcher(None, token, ocr_w).ratio()
                    if ratio >= 0.82:
                        matched_name_tokens.append(token)
                        break

    # 3. Check roll number match if provided
    roll_matched = False
    if roll_number:
        clean_roll = re.sub(r"\D", "", roll_number)
        if len(clean_roll) >= 6:
            if clean_roll in cleaned_ocr or clean_roll[-7:] in cleaned_ocr:
                roll_matched = True

    # If roll number matches exactly on the document, that is strong verification
    if roll_matched:
        return True, "College enrollment verified via matching roll number."

    # If student's name tokens match
    if matched_name_tokens:
        return True, f"Name verified on document (matched: {', '.join(matched_name_tokens)})."

    # Name is completely absent from the card/receipt
    return False, (
        f"The name on the uploaded document does not match your entered Full Name ('{full_name}'). "
        "Please ensure your College ID card or Fee Receipt is clear, legible, and belongs to you."
    )
