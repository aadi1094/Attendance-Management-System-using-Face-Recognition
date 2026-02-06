from flask import Blueprint

from app.database import get_db

main_bp = Blueprint("main", __name__)


@main_bp.route("/", methods=["GET"])
def index():
    return {"message": "Attendance Management System API", "docs": "/health"}


@main_bp.route("/health", methods=["GET"])
def health():
    try:
        get_db().command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {
        "status": "ok",
        "message": "Attendance Management System API",
        "database": db_status,
    }
