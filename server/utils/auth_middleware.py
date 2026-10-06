from functools import wraps
from flask import request, jsonify, g
from services.auth_service import decode_token
from db import db_session
from db.models import User


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Требуется авторизация"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Неверный или истёкший токен"}), 401

        user = db_session.query(User).filter_by(user_id=payload["user_id"]).first()
        if not user:
            return jsonify({"error": "Пользователь не найден"}), 401

        g.current_user = user
        return f(*args, **kwargs)

    return decorated