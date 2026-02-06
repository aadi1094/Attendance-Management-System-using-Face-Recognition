from flask import Blueprint, request, jsonify

from app.database import get_subjects_collection
from app.models.subject import subject_schema, subject_doc_to_response

subjects_bp = Blueprint("subjects", __name__, url_prefix="/api/subjects")


@subjects_bp.route("", methods=["GET"])
def list_subjects():
    """List all subjects."""
    coll = get_subjects_collection()
    cursor = coll.find().sort("name", 1)
    subjects = [subject_doc_to_response(d) for d in cursor]
    return jsonify({"subjects": subjects})


@subjects_bp.route("", methods=["POST"])
def create_subject():
    """Create a subject. Body: { name }"""
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name required"}), 400

    coll = get_subjects_collection()
    if coll.find_one({"name": name}):
        return jsonify({"error": "Subject already exists"}), 409

    doc = subject_schema(name)
    result = coll.insert_one(doc)
    doc["_id"] = result.inserted_id
    return jsonify(subject_doc_to_response(doc)), 201
