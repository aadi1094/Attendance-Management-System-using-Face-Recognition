"""
Subject model & schema.

Schema:
  - _id: ObjectId
  - name: str (unique)
  - createdAt: datetime
"""


def subject_schema(name: str) -> dict:
    from datetime import datetime

    return {
        "name": str(name).strip(),
        "createdAt": datetime.utcnow(),
    }


def subject_doc_to_response(doc: dict) -> dict:
    """Convert MongoDB document to API response."""
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "name": doc["name"],
        "createdAt": doc["createdAt"].isoformat() if doc.get("createdAt") else None,
    }
