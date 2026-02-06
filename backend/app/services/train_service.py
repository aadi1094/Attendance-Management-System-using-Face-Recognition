"""
LBPH face model training.
Reads images from TrainingImage/ folder, trains OpenCV LBPH, saves Trainner.yml.
Uses id_to_enrollment.json so predicted label (int) maps to exact enrollment string (e.g. "04").
"""
import json
import os

import cv2
import numpy as np
from PIL import Image

from app.config import Config

LABELS_FILENAME = "id_to_enrollment.json"


def _get_detector():
    detector = cv2.CascadeClassifier(Config.HAARCASCADE_PATH)
    if detector.empty():
        raise RuntimeError("Haarcascade file not found or invalid")
    return detector


def get_images_and_labels(path: str):
    """
    Load faces and labels from images.
    Filename: Name.enrollment.sampleNum.jpg -> enrollment is the second segment (kept as string).
    Returns (face_samples, label_ids, id_to_enrollment) so prediction id maps to enrollment string.
    """
    detector = _get_detector()
    image_paths = [os.path.join(path, f) for f in os.listdir(path) if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    face_samples = []
    enrollment_strings = []

    for image_path in image_paths:
        try:
            pil_img = Image.open(image_path).convert("L")
            img_np = np.array(pil_img, "uint8")
            # Filename: Name.enrollment.sampleNum.jpg -> enrollment is the second segment
            parts = os.path.basename(image_path).split(".")
            if len(parts) < 4:
                continue
            enrollment_str = parts[1]
        except (ValueError, IndexError, OSError):
            continue

        faces = detector.detectMultiScale(img_np)
        for (x, y, w, h) in faces:
            face_samples.append(img_np[y : y + h, x : x + w])
            enrollment_strings.append(enrollment_str)

    # Unique enrollments in stable order; label id = index into this list
    unique_enrollments = sorted(set(enrollment_strings))
    id_to_enrollment = unique_enrollments
    enrollment_to_id = {e: i for i, e in enumerate(unique_enrollments)}
    ids = [enrollment_to_id[e] for e in enrollment_strings]

    return face_samples, ids, id_to_enrollment


def train_model() -> dict:
    """
    Train LBPH model on TrainingImage/ folder.
    Saves Trainner.yml and id_to_enrollment.json for mapping predicted id -> enrollment string.
    Returns: { success, message, studentCount?, imageCount? }
    """
    path = Config.TRAINING_IMAGE_PATH
    if not os.path.exists(path):
        raise ValueError("TrainingImage folder not found")

    face_samples, ids, id_to_enrollment = get_images_and_labels(path)
    if not face_samples or not ids:
        raise ValueError("No valid face images found in TrainingImage folder")

    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(face_samples, np.array(ids))

    os.makedirs(Config.TRAINING_LABEL_PATH, exist_ok=True)
    model_path = os.path.join(Config.TRAINING_LABEL_PATH, "Trainner.yml")
    recognizer.save(model_path)

    labels_path = os.path.join(Config.TRAINING_LABEL_PATH, LABELS_FILENAME)
    with open(labels_path, "w") as f:
        json.dump(id_to_enrollment, f)

    return {
        "success": True,
        "message": "Model trained successfully",
        "studentCount": len(id_to_enrollment),
        "imageCount": len(face_samples),
    }
