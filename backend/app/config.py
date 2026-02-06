import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "attendance_system")

    # Image storage: local (required for LBPH training) + Cloudinary (optional cloud backup)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _img = os.getenv("TRAINING_IMAGE_PATH", "").strip()
    _lbl = os.getenv("TRAINING_LABEL_PATH", "").strip()
    TRAINING_IMAGE_PATH = os.path.join(BASE_DIR, _img) if _img and not os.path.isabs(_img) else (_img or os.path.join(BASE_DIR, "TrainingImage"))
    TRAINING_LABEL_PATH = os.path.join(BASE_DIR, _lbl) if _lbl and not os.path.isabs(_lbl) else (_lbl or os.path.join(BASE_DIR, "TrainingImageLabel"))
    _project_root = os.path.dirname(BASE_DIR)
    _haar_in_backend = os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml")
    _haar_in_root = os.path.join(_project_root, "haarcascade_frontalface_default.xml")
    HAARCASCADE_PATH = os.getenv(
        "HAARCASCADE_PATH",
        _haar_in_backend if os.path.exists(_haar_in_backend) else _haar_in_root,
    )

    # Auth - Admin credentials (for admin login)
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@attendance.com").strip().lower()
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
    JWT_SECRET = os.getenv("JWT_SECRET", SECRET_KEY)
    JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # Cloudinary (optional - set to enable cloud storage)
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
