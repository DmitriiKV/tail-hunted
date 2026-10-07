from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth import auth_bp
from routes.companies import companies_bp
from routes.resumes import resumes_bp
from routes.vacancies import vacancies_bp
from db import db_session


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(companies_bp)
    app.register_blueprint(resumes_bp)
    app.register_blueprint(vacancies_bp)

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)