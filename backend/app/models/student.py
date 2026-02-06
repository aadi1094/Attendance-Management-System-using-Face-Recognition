"""
Student model & schema.

Schema:
  - _id: ObjectId (MongoDB default)
  - enrollment: str (unique)
  - name: str
  - email: str (unique) — for login
  - passwordHash: str — bcrypt hash
  - imageCount: int — number of face images captured
  - createdAt: datetime
  - updatedAt: datetime
"""


def student_schema(
    enrollment: str,
    name: str,
    email: str,
    password_hash: str,
    image_count: int = 0,
) -> dict:
    from datetime import datetime

    now = datetime.utcnow()
    return {
        "enrollment": str(enrollment).strip(),
        "name": str(name).strip(),
        "email": str(email).strip().lower(),
        "passwordHash": password_hash,
        "imageCount": image_count,
        "createdAt": now,
        "updatedAt": now,
    }


def student_doc_to_response(doc: dict, include_email: bool = True) -> dict:
    """Convert MongoDB document to API response (exclude passwordHash)."""
    if not doc:
        return None
    out = {
        "id": str(doc["_id"]),
        "enrollment": doc["enrollment"],
        "name": doc["name"],
        "imageCount": doc.get("imageCount", 0),
        "createdAt": doc["createdAt"].isoformat() if doc.get("createdAt") else None,
        "updatedAt": doc["updatedAt"].isoformat() if doc.get("updatedAt") else None,
    }
    if include_email:
        out["email"] = doc.get("email")
    return out
