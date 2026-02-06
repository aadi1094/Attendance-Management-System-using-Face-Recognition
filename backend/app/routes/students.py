from flask import Blueprint, request, jsonify

import bcrypt

from app.database import get_students_collection
from app.models.student import student_schema, student_doc_to_response
from app.services.face_image_service import save_face_image

students_bp = Blueprint("students", __name__, url_prefix="/api/students")


@students_bp.route("/register", methods=["POST"])
def register():
    """Student self-registration. Body: enrollment, name, email, password."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON body required"}), 400

    enrollment = data.get("enrollment", "").strip()
    name = data.get("name", "").strip()
    email = (data.get("email", "") or "").strip().lower()
    password = data.get("password", "")

    errors = []
    if not enrollment:
        errors.append("enrollment is required")
    if not name:
        errors.append("name is required")
    if not email:
        errors.append("email is required")
    if not password or len(password) < 6:
        errors.append("password must be at least 6 characters")

    if errors:
        return jsonify({"error": "; ".join(errors)}), 400

    if not enrollment.isdigit():
        return jsonify({"error": "enrollment must be numeric"}), 400

    coll = get_students_collection()

    if coll.find_one({"enrollment": enrollment}):
        return jsonify({"error": "Enrollment already registered"}), 409
    if coll.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    doc = student_schema(enrollment, name, email, password_hash, image_count=0)
    result = coll.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify(student_doc_to_response(doc)), 201


@students_bp.route("", methods=["GET"])
def list_students():
    """List all students. Query: skip, limit (optional)."""
    skip = max(0, request.args.get("skip", 0, type=int))
    limit = min(100, max(1, request.args.get("limit", 50, type=int)))

    coll = get_students_collection()
    cursor = coll.find().sort("createdAt", -1).skip(skip).limit(limit)
    students = [student_doc_to_response(d) for d in cursor]

    total = coll.count_documents({})

    return jsonify({
        "students": students,
        "total": total,
        "skip": skip,
        "limit": limit,
    })


@students_bp.route("/<enrollment>", methods=["GET"])
def get_student(enrollment):
    """Get student by enrollment."""
    coll = get_students_collection()
    doc = coll.find_one({"enrollment": enrollment})
    if not doc:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(student_doc_to_response(doc))


@students_bp.route("/<enrollment>/images", methods=["POST"])
def upload_face_image(enrollment):
    """Upload face image for training. Body: { image: base64 }."""
    coll = get_students_collection()
    doc = coll.find_one({"enrollment": enrollment})
    if not doc:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json() or {}
    image_b64 = data.get("image")
    if not image_b64:
        return jsonify({"error": "image (base64) required in JSON body"}), 400

    try:
        result = save_face_image(enrollment, doc["name"], image_b64)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500

    from datetime import datetime
    new_count = doc.get("imageCount", 0) + 1
    coll.update_one(
        {"enrollment": enrollment},
        {"$set": {"imageCount": new_count, "updatedAt": datetime.utcnow()}},
    )

    return jsonify({
        "message": "Image saved",
        "filename": result["filename"],
        "sampleNum": result["sampleNum"],
        "cloudinaryUrl": result.get("cloudinaryUrl"),
        "imageCount": new_count,
    }), 201


@students_bp.route("/<enrollment>", methods=["DELETE"])
def delete_student(enrollment):
    """Delete student by enrollment. (Admin-only in Phase 6.)"""
    coll = get_students_collection()
    result = coll.delete_one({"enrollment": enrollment})
    if result.deleted_count == 0:
        return jsonify({"error": "Student not found"}), 404
    return jsonify({"message": "Student deleted"}), 200
