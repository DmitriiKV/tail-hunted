from flask import Blueprint, g, jsonify, request
from sqlalchemy import desc

from db import db_session
from db.models import Notification
from services.notification_service import notification_to_dict
from utils.access import error
from utils.auth_middleware import token_required

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


def _own():
    return db_session.query(Notification).filter(Notification.user_id == g.current_user.user_id)


@notifications_bp.route("", methods=["GET"])
@token_required
def get_notifications():
    limit = min(request.args.get("limit", 50, type=int), 100)
    items = _own().order_by(desc(Notification.created_at)).limit(limit).all()
    return jsonify({"notifications": [notification_to_dict(n) for n in items]})


@notifications_bp.route("/unread-count", methods=["GET"])
@token_required
def get_unread_count():
    return jsonify({"unread_count": _own().filter(Notification.is_read.is_(False)).count()})


@notifications_bp.route("/<int:notification_id>/read", methods=["PATCH"])
@token_required
def mark_read(notification_id):
    notification = _own().filter(Notification.notification_id == notification_id).first()
    if not notification:
        return error("Уведомление не найдено", 404)
    notification.is_read = True
    db_session.commit()
    return jsonify({"ok": True})


@notifications_bp.route("/read-all", methods=["PATCH"])
@token_required
def mark_all_read():
    _own().filter(Notification.is_read.is_(False)).update(
        {Notification.is_read: True}, synchronize_session=False
    )
    db_session.commit()
    return jsonify({"ok": True})
