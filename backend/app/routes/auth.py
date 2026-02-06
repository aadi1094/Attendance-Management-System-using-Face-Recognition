from flask import Blueprint, request, jsonify

from app.services.auth_service import login

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login_route():
    """Login. Body: { email, password, role: "student"|"teacher"|"admin" }"""
    data = request.get_json() or {}
    email = (data.get("email") or "").strip()
    password = data.get("password", "")
    role = (data.get("role") or "student").strip().lower()

    if not email:
        return jsonify({"error": "email required"}), 400
    if not password:
        return jsonify({"error": "password required"}), 400
    if role not in ("student", "teacher", "admin"):
        return jsonify({"error": "role must be student, teacher, or admin"}), 400

    result = login(email, password, role)
    if not result:
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify(result)
