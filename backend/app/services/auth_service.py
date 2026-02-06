"""
Auth service: login for student, teacher, admin. Returns JWT.
"""
from datetime import datetime, timedelta

import bcrypt
import jwt

from app.config import Config
from app.database import get_students_collection, get_teachers_collection


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def _create_token(payload: dict) -> str:
    payload["exp"] = datetime.utcnow() + timedelta(hours=Config.JWT_EXPIRY_HOURS)
    payload["iat"] = datetime.utcnow()
    return jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")


def login_student(email: str, password: str) -> dict | None:
    coll = get_students_collection()
    doc = coll.find_one({"email": email.strip().lower()})
    if not doc or not _verify_password(password, doc["passwordHash"]):
        return None
    return {
        "token": _create_token({
            "sub": str(doc["_id"]),
            "email": doc["email"],
            "role": "student",
            "enrollment": doc["enrollment"],
            "name": doc["name"],
        }),
        "user": {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "role": "student",
            "enrollment": doc["enrollment"],
            "name": doc["name"],
        },
    }


def login_teacher(email: str, password: str) -> dict | None:
    coll = get_teachers_collection()
    doc = coll.find_one({"email": email.strip().lower()})
    if not doc or not _verify_password(password, doc["passwordHash"]):
        return None
    return {
        "token": _create_token({
            "sub": str(doc["_id"]),
            "email": doc["email"],
            "role": "teacher",
            "name": doc["name"],
        }),
        "user": {
            "id": str(doc["_id"]),
            "email": doc["email"],
            "role": "teacher",
            "name": doc["name"],
            "assignedSubjectIds": [str(x) for x in doc.get("assignedSubjectIds", [])],
        },
    }


def login_admin(email: str, password: str) -> dict | None:
    admin_email = Config.ADMIN_EMAIL
    admin_password = Config.ADMIN_PASSWORD
    if not admin_email or not admin_password:
        return None
    if email.strip().lower() != admin_email or password != admin_password:
        return None
    return {
        "token": _create_token({
            "sub": "admin",
            "email": admin_email,
            "role": "admin",
        }),
        "user": {
            "id": "admin",
            "email": admin_email,
            "role": "admin",
        },
    }


def login(email: str, password: str, role: str) -> dict | None:
    if role == "student":
        return login_student(email, password)
    if role == "teacher":
        return login_teacher(email, password)
    if role == "admin":
        return login_admin(email, password)
    return None
