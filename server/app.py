from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth import auth_bp


def create_app():
    app = Flask(__name__)
    CORS(app)  # разрешаем запросы с localhost:5173

    app.register_blueprint(auth_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)