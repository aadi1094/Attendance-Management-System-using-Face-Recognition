"""Teacher routes. POST /api/teachers for creating teachers (admin-only later)."""
from flask import Blueprint, request, jsonify

import bcrypt

from app.database import get_teachers_collection
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
