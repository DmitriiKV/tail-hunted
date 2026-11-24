from db import db_session
from db.models import Notification


def create_notification(user_id, title, message, notification_type, app_id=None, inv_id=None):
    notification = Notification(
        user_id=user_id,
        app_id=app_id,
        inv_id=inv_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )
    db_session.add(notification)
    return notification


def notification_to_dict(n):
    source = n.application or n.invitation
    return {
        "notification_id": n.notification_id,
        "app_id": n.app_id,
        "inv_id": n.inv_id,
        "vac_id": source.vac_id if source else None,
        "title": n.title,
        "message": n.message,
        "notification_type": n.notification_type,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }
