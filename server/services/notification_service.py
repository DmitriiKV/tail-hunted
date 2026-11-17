
from db import db_session
from db.models import Notification


def create_notification(
    user_id,
    title,
    message,
    notification_type,
    app_id=None
):
    notification = Notification(
        user_id=user_id,
        app_id=app_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False
    )

    db_session.add(notification)
    return notification
