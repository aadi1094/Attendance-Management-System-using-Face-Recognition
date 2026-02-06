import os

from flask import Blueprint, jsonify

from app.config import Config
from app.services.train_service import train_model

train_bp = Blueprint("train", __name__, url_prefix="/api")


@train_bp.route("/train/status", methods=["GET"])
def train_status():
    """Check if model is trained (Trainner.yml exists)."""
    path = os.path.join(Config.TRAINING_LABEL_PATH, "Trainner.yml")
    return jsonify({"trained": os.path.isfile(path)})


@train_bp.route("/train", methods=["POST"])
def train_model_endpoint():
    """Train LBPH face recognition model on TrainingImage folder."""
    try:
        result = train_model()
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
