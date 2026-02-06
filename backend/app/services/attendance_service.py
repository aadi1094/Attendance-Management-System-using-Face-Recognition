"""
Attendance service: auto (face recognition) and manual recording.
"""
import base64
import json
import os
from datetime import datetime

import cv2
import numpy as np

from app.config import Config
from app.database import get_students_collection, get_attendance_collection
from app.models.attendance import attendance_schema, attendance_doc_to_response

CONFIDENCE_THRESHOLD = 80  # Lower conf = better match; accept up to 80 (was 70)
_model_path = None
_recognizer = None
_detector = None
_id_to_enrollment = None
_labels_path = None


def _load_recognizer():
    global _recognizer, _model_path, _id_to_enrollment, _labels_path
    path = os.path.join(Config.TRAINING_LABEL_PATH, "Trainner.yml")
    if not os.path.exists(path):
        raise ValueError("Model not found. Train the model first via POST /api/train")
    if _recognizer is None or _model_path != path:
        _recognizer = cv2.face.LBPHFaceRecognizer_create()
        _recognizer.read(path)
        _model_path = path
        _id_to_enrollment = None
        _labels_path = os.path.join(Config.TRAINING_LABEL_PATH, "id_to_enrollment.json")
    return _recognizer


def _predicted_id_to_enrollment(predicted_id: int) -> str:
    """Map LBPH predicted label id to enrollment string (from id_to_enrollment.json if present)."""
    global _id_to_enrollment, _labels_path
    if _labels_path is None:
        _labels_path = os.path.join(Config.TRAINING_LABEL_PATH, "id_to_enrollment.json")
    if _id_to_enrollment is None and os.path.exists(_labels_path):
        with open(_labels_path) as f:
            _id_to_enrollment = json.load(f)
    if _id_to_enrollment is not None and 0 <= predicted_id < len(_id_to_enrollment):
        return str(_id_to_enrollment[predicted_id])
    return str(predicted_id)


def _load_detector():
    global _detector
    if _detector is None:
        _detector = cv2.CascadeClassifier(Config.HAARCASCADE_PATH)
        if _detector.empty():
            raise RuntimeError("Haarcascade file not found or invalid")
    return _detector


def recognize_face_and_record(image_base64: str, subject: str) -> dict:
    """
    Decode image, detect face, recognize via LBPH, record attendance.
    Returns: { enrollment, name, subject, date, time, id }
    Raises: ValueError on invalid input, no face, unknown face, or low confidence.
    """
    if not image_base64 or not subject:
        raise ValueError("image (base64) and subject required")

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

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    detector = _load_detector()
    faces = detector.detectMultiScale(gray, 1.2, 5)

    if len(faces) == 0:
        raise ValueError("No face detected")
    if len(faces) > 1:
        raise ValueError("Multiple faces detected - ensure only one face in frame")

    x, y, w, h = faces[0]
    recognizer = _load_recognizer()
    enrollment_int, conf = recognizer.predict(gray[y : y + h, x : x + w])

    if conf >= CONFIDENCE_THRESHOLD:
        raise ValueError(f"Face not recognized (confidence {conf:.1f} >= {CONFIDENCE_THRESHOLD})")

    enrollment = _predicted_id_to_enrollment(enrollment_int)
    coll = get_students_collection()
    student = coll.find_one({"enrollment": enrollment})
    if not student:
        raise ValueError(f"Enrollment {enrollment} not found in students")

    name = student.get("name", "")
    ts = datetime.utcnow()
    date = ts.strftime("%Y-%m-%d")
    time_str = ts.strftime("%H:%M:%S")

    doc = attendance_schema(enrollment, name, subject.strip(), date, time_str, "auto")
    coll_att = get_attendance_collection()

    # Optional: prevent duplicate same day same subject (keep first)
    existing = coll_att.find_one({
        "enrollment": enrollment,
        "subject": subject.strip(),
        "date": date,
    })
    if existing:
        return attendance_doc_to_response(existing)  # Already marked

    result = coll_att.insert_one(doc)
    doc["_id"] = result.inserted_id
    return attendance_doc_to_response(doc)


def record_manual(enrollment: str, name: str, subject: str, date: str = None, time_str: str = None) -> dict:
    """Record manual attendance. Date/time default to now."""
    if not enrollment or not name or not subject:
        raise ValueError("enrollment, name, and subject required")

    ts = datetime.utcnow()
    date = date or ts.strftime("%Y-%m-%d")
    time_str = time_str or ts.strftime("%H:%M:%S")

    doc = attendance_schema(enrollment.strip(), name.strip(), subject.strip(), date, time_str, "manual")
    coll = get_attendance_collection()
    result = coll.insert_one(doc)
    doc["_id"] = result.inserted_id
    return attendance_doc_to_response(doc)


def list_attendance(subject: str = None, date: str = None, skip: int = 0, limit: int = 100):
    """List attendance records with optional filters."""
    coll = get_attendance_collection()
    query = {}
    if subject:
        query["subject"] = subject.strip()
    if date:
        query["date"] = date.strip()

    total = coll.count_documents(query)
    cursor = coll.find(query).sort("createdAt", -1).skip(skip).limit(limit)
    records = [attendance_doc_to_response(d) for d in cursor]

    return {"attendance": records, "total": total, "skip": skip, "limit": limit}
