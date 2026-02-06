import certifi
from pymongo import MongoClient, ASCENDING, DESCENDING

from app.config import Config

_client = None
_db = None


def get_db():
    global _db
    if _db is None:
        client = MongoClient(
            Config.MONGODB_URI,
            tlsCAFile=certifi.where(),
        )
        _db = client[Config.DATABASE_NAME]
        try:
            init_indexes(_db)
        except Exception:
            pass  # indexes may already exist
    return _db


def get_students_collection():
    return get_db()["students"]


def get_attendance_collection():
    return get_db()["attendance"]


def get_subjects_collection():
    return get_db()["subjects"]


def get_teachers_collection():
    return get_db()["teachers"]


def init_indexes(db):
    """Create indexes for common queries."""
    students = db["students"]
    students.create_index("enrollment", unique=True)
    students.create_index("email", unique=True)
    students.create_index([("createdAt", DESCENDING)])

    attendance = db["attendance"]
    attendance.create_index([("subject", ASCENDING), ("date", DESCENDING)])
    attendance.create_index([("enrollment", ASCENDING), ("subject", ASCENDING), ("date", ASCENDING)])
    attendance.create_index("createdAt", DESCENDING)

    subjects = db["subjects"]
    subjects.create_index("name", unique=True)
    subjects.create_index("createdAt", DESCENDING)

    teachers = db["teachers"]
    teachers.create_index("email", unique=True)
    teachers.create_index([("createdAt", DESCENDING)])
