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
from app.services.face_image_service import save_attendance_face_crop

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
    Decode image, detect all faces, recognize each via LBPH, record attendance for each.
    Supports multiple students in the same frame.
    Returns: { records: [...], count: N } where each record has enrollment, name, subject, date, time, id.
    Raises: ValueError on invalid input, no face, or when no face could be recognized.
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

    recognizer = _load_recognizer()
    coll = get_students_collection()
    coll_att = get_attendance_collection()
    ts = datetime.utcnow()
    date = ts.strftime("%Y-%m-%d")
    time_str = ts.strftime("%H:%M:%S")
    subject_clean = subject.strip()

    records = []
    recorded_enrollments = set()  # avoid duplicates within same capture

    def _get_saved_today_count(enrollment: str) -> int:
        """Count attendance face crops saved today for this student."""
        from app.database import get_db
        coll = get_db()["attendance_face_saves"]
        doc = coll.find_one({"enrollment": enrollment, "date": date})
        return doc.get("count", 0) if doc else 0

    def _inc_saved_today(enrollment: str):
        from app.database import get_db
        coll = get_db()["attendance_face_saves"]
        coll.update_one(
            {"enrollment": enrollment, "date": date},
            {"$inc": {"count": 1}},
            upsert=True,
        )

    for (x, y, w, h) in faces:
        enrollment_int, conf = recognizer.predict(gray[y : y + h, x : x + w])

        if conf >= CONFIDENCE_THRESHOLD:
            continue  # skip unrecognized face

        enrollment = _predicted_id_to_enrollment(enrollment_int)
        if enrollment in recorded_enrollments:
            continue  # already recorded this student in this capture

        student = coll.find_one({"enrollment": enrollment})
        if not student:
            continue

        name = student.get("name", "")
        recorded_enrollments.add(enrollment)

        # Continuous learning: save face crop for future retraining (if enabled and under limit)
        face_roi = gray[y : y + h, x : x + w]
        count_today = _get_saved_today_count(enrollment)
        max_per_day = getattr(Config, "MAX_ATTENDANCE_FACES_PER_STUDENT_PER_DAY", 2)
        if count_today < max_per_day and save_attendance_face_crop(enrollment, name, face_roi):
            _inc_saved_today(enrollment)
            new_count = student.get("imageCount", 0) + 1
            coll.update_one(
                {"enrollment": enrollment},
                {"$set": {"imageCount": new_count, "updatedAt": ts}},
            )

        existing = coll_att.find_one({
            "enrollment": enrollment,
            "subject": subject_clean,
            "date": date,
        })
        if existing:
            # Update time to current capture so all students in same frame show same timestamp
            coll_att.update_one(
                {"_id": existing["_id"]},
                {"$set": {"time": time_str, "createdAt": ts}},
            )
            existing["time"] = time_str
            existing["createdAt"] = ts
            records.append(attendance_doc_to_response(existing))
            continue

        doc = attendance_schema(enrollment, name, subject_clean, date, time_str, "auto")
        result = coll_att.insert_one(doc)
        doc["_id"] = result.inserted_id
        records.append(attendance_doc_to_response(doc))

    if len(records) == 0:
        raise ValueError(
            "No face recognized. Ensure students are trained and face the camera clearly."
        )

    return {"records": records, "count": len(records)}


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


def list_attendance(
    subject: str = None,
    date: str = None,
    enrollment: str = None,
    date_from: str = None,
    date_to: str = None,
    skip: int = 0,
    limit: int = 100,
):
    """List attendance records with optional filters."""
    coll = get_attendance_collection()
    query = {}
    if subject:
        query["subject"] = subject.strip()
    if enrollment:
        query["enrollment"] = enrollment.strip()
    if date_from or date_to:
        if date_from and date_to:
            query["date"] = {"$gte": date_from.strip(), "$lte": date_to.strip()}
        elif date_from:
            query["date"] = {"$gte": date_from.strip()}
        else:
            query["date"] = {"$lte": date_to.strip()}
    elif date:
        query["date"] = date.strip()

    total = coll.count_documents(query)
    cursor = coll.find(query).sort("date", -1).sort("createdAt", -1).skip(skip).limit(limit)
    records = [attendance_doc_to_response(d) for d in cursor]

    return {"attendance": records, "total": total, "skip": skip, "limit": limit}


def export_attendance_csv(
    subject: str = None,
    date: str = None,
    enrollment: str = None,
    date_from: str = None,
    date_to: str = None,
    limit: int = 5000,
) -> str:
    """Export attendance records as CSV string."""
    import csv
    import io

    result = list_attendance(
        subject=subject,
        date=date,
        enrollment=enrollment,
        date_from=date_from,
        date_to=date_to,
        skip=0,
        limit=limit,
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Enrollment", "Name", "Subject", "Date", "Time", "Type"])
    for r in result["attendance"]:
        writer.writerow([
            r.get("enrollment", ""),
            r.get("name", ""),
            r.get("subject", ""),
            r.get("date", ""),
            r.get("time", ""),
            r.get("type", "auto"),
        ])
    return output.getvalue()
