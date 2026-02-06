"""
Teacher model & schema.

Schema:
  - _id: ObjectId
  - name: str
  - email: str (unique)
  - passwordHash: str
  - assignedSubjectIds: list of ObjectId (refs to subjects)
  - createdAt: datetime
  - updatedAt: datetime
"""


def teacher_schema(name: str, email: str, password_hash: str, assigned_subject_ids=None) -> dict:
    from datetime import datetime

    now = datetime.utcnow()
    return {
        "name": str(name).strip(),
        "email": str(email).strip().lower(),
        "passwordHash": password_hash,
        "assignedSubjectIds": assigned_subject_ids or [],
        "createdAt": now,
        "updatedAt": now,
    }


def teacher_doc_to_response(doc: dict, include_email: bool = True) -> dict:
    if not doc:
        return None
    out = {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "assignedSubjectIds": [str(x) for x in doc.get("assignedSubjectIds", [])],
        "createdAt": doc["createdAt"].isoformat() if doc.get("createdAt") else None,
    }
    if include_email:
        out["email"] = doc.get("email")
    return out
