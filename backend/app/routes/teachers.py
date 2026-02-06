"""Teacher routes. POST /api/teachers for creating teachers (admin-only later)."""
from datetime import datetime

import bcrypt
from bson import ObjectId
from flask import Blueprint, request, jsonify

from app.database import get_teachers_collection, get_subjects_collection
from app.models.teacher import teacher_schema, teacher_doc_to_response

teachers_bp = Blueprint("teachers", __name__, url_prefix="/api/teachers")


@teachers_bp.route("", methods=["GET"])
def list_teachers():
    """List all teachers."""
    coll = get_teachers_collection()
    cursor = coll.find().sort("createdAt", -1)
    teachers = [teacher_doc_to_response(d) for d in cursor]
    return jsonify({"teachers": teachers})


@teachers_bp.route("", methods=["POST"])
def create_teacher():
    """Create teacher. Body: { name, email, password }"""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not name:
        return jsonify({"error": "name required"}), 400
    if not email:
        return jsonify({"error": "email required"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    coll = get_teachers_collection()
    if coll.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    doc = teacher_schema(name, email, password_hash)
    result = coll.insert_one(doc)
    doc["_id"] = result.inserted_id

    return jsonify(teacher_doc_to_response(doc)), 201


@teachers_bp.route("/<teacher_id>", methods=["GET"])
def get_teacher(teacher_id):
    """Get a single teacher by ID."""
    try:
        oid = ObjectId(teacher_id)
    except Exception:
        return jsonify({"error": "Invalid teacher ID"}), 400

    coll = get_teachers_collection()
    doc = coll.find_one({"_id": oid})
    if not doc:
        return jsonify({"error": "Teacher not found"}), 404

    return jsonify(teacher_doc_to_response(doc))


@teachers_bp.route("/<teacher_id>", methods=["PATCH"])
def update_teacher(teacher_id):
    """Update teacher, primarily for assigning subjects. Body: { assignedSubjectIds: string[] }"""
    try:
        oid = ObjectId(teacher_id)
    except Exception:
        return jsonify({"error": "Invalid teacher ID"}), 400

    data = request.get_json() or {}
    assigned_ids = data.get("assignedSubjectIds")

    if assigned_ids is None:
        return jsonify({"error": "assignedSubjectIds required"}), 400

    if not isinstance(assigned_ids, list):
        return jsonify({"error": "assignedSubjectIds must be an array"}), 400

    sub_coll = get_subjects_collection()
    valid_oids = []
    for sid in assigned_ids:
        if not sid:
            continue
        try:
            o = ObjectId(sid)
            if sub_coll.find_one({"_id": o}):
                valid_oids.append(o)
        except Exception:
            pass

    coll = get_teachers_collection()
    result = coll.update_one(
        {"_id": oid},
        {"$set": {"assignedSubjectIds": valid_oids, "updatedAt": datetime.utcnow()}},
    )
    if result.matched_count == 0:
        return jsonify({"error": "Teacher not found"}), 404

    doc = coll.find_one({"_id": oid})
    return jsonify(teacher_doc_to_response(doc))
