from flask import Blueprint, request, jsonify
from db import db_session
from db.models import User
from services.auth_service import hash_password, verify_password, create_token
from flask import g
from utils.auth_middleware import token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    # Валидация
    required = ["email", "password", "last_name", "first_name", "role"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Поле '{field}' обязательно"}), 400

    if data["role"] not in ("candidate", "employer"):
        return jsonify({"error": "role должен быть candidate или employer"}), 400

    # Проверка на существующий email
    existing = db_session.query(User).filter_by(user_email=data["email"]).first()
    if existing:
        return jsonify({"error": "Пользователь с таким email уже существует"}), 400

    user = User(
        user_email=data["email"],
        password=hash_password(data["password"]),
        last_name=data["last_name"],
        first_name=data["first_name"],
        middle_name=data.get("middle_name", ""),
        role=data["role"],
    )
    db_session.add(user)
    db_session.commit()

    token = create_token(user.user_id)
    return jsonify({
        "token": token,
        "user": {
            "id": user.user_id,
            "email": user.user_email,
            "role": user.role,
            "full_name": f"{user.last_name} {user.first_name} {user.middle_name}".strip(),
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email и пароль обязательны"}), 400

    user = db_session.query(User).filter_by(user_email=email).first()
    if not user or not verify_password(password, user.password):
        return jsonify({"error": "Неверный email или пароль"}), 401

    token = create_token(user.user_id)
    return jsonify({
        "token": token,
        "user": {
            "id": user.user_id,
            "email": user.user_email,
            "role": user.role,
            "full_name": f"{user.last_name} {user.first_name} {user.middle_name}".strip(),
        }
    })

@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    user = g.current_user
    return jsonify({
        "id": user.user_id,
        "email": user.user_email,
        "role": user.role,
        "last_name": user.last_name,
        "first_name": user.first_name,
        "middle_name": user.middle_name,
    })