"""
Attendance model & schema.

Schema:
  - _id: ObjectId
  - enrollment: str
  - name: str
  - subject: str
  - date: str — YYYY-MM-DD
  - time: str — HH:MM:SS
  - type: str — "auto" | "manual"
  - createdAt: datetime
"""


def attendance_schema(
    enrollment: str,
    name: str,
    subject: str,
    date: str,
    time: str,
    attendance_type: str = "auto",
) -> dict:
    from datetime import datetime

    return {
        "enrollment": str(enrollment).strip(),
        "name": str(name).strip(),
        "subject": str(subject).strip(),
        "date": str(date).strip(),
        "time": str(time).strip(),
        "type": attendance_type if attendance_type in ("auto", "manual") else "manual",
        "createdAt": datetime.utcnow(),
    }


def attendance_doc_to_response(doc: dict) -> dict:
    """Convert MongoDB document to API response."""
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "enrollment": doc["enrollment"],
        "name": doc["name"],
        "subject": doc["subject"],
        "date": doc["date"],
        "time": doc["time"],
        "type": doc.get("type", "manual"),
        "createdAt": doc["createdAt"].isoformat() if doc.get("createdAt") else None,
    }
