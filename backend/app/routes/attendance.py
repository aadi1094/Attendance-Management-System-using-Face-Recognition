from flask import Blueprint, request, jsonify

from app.services.attendance_service import (
    recognize_face_and_record,
    record_manual,
    list_attendance,
)

attendance_bp = Blueprint("attendance", __name__, url_prefix="/api/attendance")


@attendance_bp.route("/auto", methods=["POST"])
def auto_attendance():
    """Recognize face from image and record attendance. Body: { image: base64, subject: str }"""
    data = request.get_json() or {}
    image_b64 = data.get("image")
    subject = (data.get("subject") or "").strip()

    if not image_b64:
        return jsonify({"error": "image (base64) required in JSON body"}), 400
    if not subject:
        return jsonify({"error": "subject required in JSON body"}), 400

    try:
        result = recognize_face_and_record(image_b64, subject)
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500


@attendance_bp.route("/manual", methods=["POST"])
def manual_attendance():
    """Record manual attendance. Body: { enrollment, name, subject, date?, time? }"""
    data = request.get_json() or {}
    enrollment = (data.get("enrollment") or "").strip()
    name = (data.get("name") or "").strip()
    subject = (data.get("subject") or "").strip()
    date = (data.get("date") or "").strip() or None
    time_str = (data.get("time") or "").strip() or None

    if not enrollment:
        return jsonify({"error": "enrollment required"}), 400
    if not name:
        return jsonify({"error": "name required"}), 400
    if not subject:
        return jsonify({"error": "subject required"}), 400

    try:
        result = record_manual(enrollment, name, subject, date, time_str)
        return jsonify(result), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@attendance_bp.route("", methods=["GET"])
def get_attendance():
    """List attendance. Query: subject=, date=, skip=0, limit=100"""
    subject = request.args.get("subject", "").strip() or None
    date = request.args.get("date", "").strip() or None
    skip = max(0, request.args.get("skip", 0, type=int))
    limit = min(100, max(1, request.args.get("limit", 50, type=int)))

    result = list_attendance(subject=subject, date=date, skip=skip, limit=limit)
    return jsonify(result)
