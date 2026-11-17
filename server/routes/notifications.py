
from flask import Blueprint, jsonify, g
from sqlalchemy import desc

from db import db_session
from db.models import Notification
from utils.auth_middleware import token_required


notifications_bp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api/notifications"
)


# Получить все уведомления текущего пользователя
@notifications_bp.route("", methods=["GET"])
@token_required
def get_notifications():
    notifications = (
        db_session.query(Notification)
        .filter(Notification.user_id == g.current_user.user_id)
        .order_by(desc(Notification.created_at))
        .all()
    )

    return jsonify({
        "notifications": [
            {
                "notification_id": item.notification_id,
                "app_id": item.app_id,
                "title": item.title,
                "message": item.message,
                "notification_type": item.notification_type,
                "is_read": item.is_read,
                "created_at": item.created_at.isoformat()
            }
            for item in notifications
        ]
    }), 200


# Получить количество непрочитанных уведомлений
@notifications_bp.route("/unread-count", methods=["GET"])
@token_required
def get_unread_count():
    count = (
        db_session.query(Notification)
        .filter(
            Notification.user_id == g.current_user.user_id,
            Notification.is_read == False
        )
        .count()
    )

    return jsonify({"unread_count": count}), 200


# Отметить одно уведомление прочитанным
@notifications_bp.route("/<int:notification_id>/read", methods=["PATCH"])
@token_required
def mark_notification_read(notification_id):
    notification = (
        db_session.query(Notification)
        .filter(
            Notification.notification_id == notification_id,
            Notification.user_id == g.current_user.user_id
        )
        .first()
    )

    if not notification:
        return jsonify({"error": "Уведомление не найдено"}), 404

    notification.is_read = True
    db_session.commit()

    return jsonify({
        "message": "Уведомление отмечено прочитанным"
    }), 200


# Отметить все уведомления прочитанными
@notifications_bp.route("/read-all", methods=["PATCH"])
@token_required
def mark_all_notifications_read():
    db_session.query(Notification).filter(
        Notification.user_id == g.current_user.user_id,
        Notification.is_read == False
    ).update(
        {Notification.is_read: True},
        synchronize_session=False
    )

    db_session.commit()

    return jsonify({
        "message": "Все уведомления отмечены прочитанными"
    }), 200
