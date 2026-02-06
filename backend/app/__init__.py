from flask import Flask
from flask_cors import CORS

from app.config import Config


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"], supports_credentials=True)

    from app.routes import main_bp
    from app.routes.students import students_bp
    from app.routes.train import train_bp
    from app.routes.attendance import attendance_bp
    from app.routes.auth import auth_bp
    from app.routes.teachers import teachers_bp
    from app.routes.subjects import subjects_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(train_bp)
    app.register_blueprint(attendance_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(teachers_bp)
    app.register_blueprint(subjects_bp)

    return app
