"""
Face image capture & storage.
- Validates face in image using Haarcascade
- Saves locally (required for LBPH training)
- Optionally uploads to Cloudinary for cloud backup
"""
import base64
import os
import re

import cv2
import numpy as np

from app.config import Config


def _ensure_dirs():
    os.makedirs(Config.TRAINING_IMAGE_PATH, exist_ok=True)
    os.makedirs(Config.TRAINING_LABEL_PATH, exist_ok=True)


def _is_cloudinary_configured():
    return bool(
        Config.CLOUDINARY_CLOUD_NAME
        and Config.CLOUDINARY_API_KEY
        and Config.CLOUDINARY_API_SECRET
    )


def _validate_face(image_array: np.ndarray) -> bool:
    """Return True if exactly one face is detected."""
    detector = cv2.CascadeClassifier(Config.HAARCASCADE_PATH)
    if detector.empty():
        raise RuntimeError("Haarcascade file not found or invalid")
    gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY) if len(image_array.shape) == 3 else image_array
    faces = detector.detectMultiScale(gray, 1.2, 5)
    return len(faces) == 1


def _sanitize_name(name: str) -> str:
    """Remove invalid chars for filename (dot used as separator)."""
    return re.sub(r'[<>:"/\\|?*]', "_", name).strip() or "student"


def save_face_image(
    enrollment: str,
    name: str,
    image_base64: str,
) -> dict:
    """
    Validate face, save locally, optionally upload to Cloudinary.
    Returns: { localPath, cloudinaryUrl?, sampleNum }
    Raises: ValueError on invalid input or no face detected.
    """
    if not enrollment or not name or not image_base64:
        raise ValueError("enrollment, name, and image (base64) required")

    # Decode base64
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        img_bytes = base64.b64decode(image_base64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Invalid image data")
    except Exception as e:
        raise ValueError(f"Invalid base64 image: {e}") from e

    if not _validate_face(img):
        raise ValueError("No face or multiple faces detected - ensure one clear face in frame")

    _ensure_dirs()
    safe_name = _sanitize_name(name)

    # Next sample number for this student
    prefix = f"{safe_name}.{enrollment}."
    existing = [f for f in os.listdir(Config.TRAINING_IMAGE_PATH) if f.startswith(prefix)]
    max_num = 0
    for f in existing:
        try:
            n = int(f.rsplit(".", 1)[0].rsplit(".", 1)[-1])
            max_num = max(max_num, n)
        except (ValueError, IndexError):
            pass
    sample_num = max_num + 1
    filename = f"{safe_name}.{enrollment}.{sample_num}.jpg"
    local_path = os.path.join(Config.TRAINING_IMAGE_PATH, filename)

    # Save locally (required for LBPH training)
    cv2.imwrite(local_path, img)

    cloudinary_url = None
    if _is_cloudinary_configured():
        try:
            import cloudinary
            import cloudinary.uploader
            cloudinary.config(
                cloud_name=Config.CLOUDINARY_CLOUD_NAME,
                api_key=Config.CLOUDINARY_API_KEY,
                api_secret=Config.CLOUDINARY_API_SECRET,
            )
            result = cloudinary.uploader.upload(local_path, folder="attendance/face_images")
            cloudinary_url = result.get("secure_url")
        except Exception:
            pass  # Non-fatal: local copy is enough for training

    return {
        "localPath": local_path,
        "filename": filename,
        "cloudinaryUrl": cloudinary_url,
        "sampleNum": sample_num,
    }
