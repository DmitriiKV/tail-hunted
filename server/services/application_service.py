
from sqlalchemy import func

from db import db_session
from db.models import Application, Vacancy

MIN_APPLICATIONS_FOR_STATS = 5
STATUSES = ("pending", "viewed", "invited", "rejected")


def company_response_stats(comp_id):
    total, answered = (
        db_session.query(
            func.count(Application.app_id),
            func.count(Application.app_id).filter(Application.status != "pending"),
        )
        .join(Vacancy, Vacancy.vac_id == Application.vac_id)
        .filter(Vacancy.comp_id == comp_id)
        .one()
    )
    if total < MIN_APPLICATIONS_FOR_STATS:
        return {"total": total, "response_rate": None}
    return {"total": total, "response_rate": round(answered / total * 100)}


def application_to_dict(app):
    return {
        "app_id": app.app_id,
        "res_id": app.res_id,
        "vac_id": app.vac_id,
        "status": app.status,
        "app_created_at": app.app_created_at.isoformat(),
        "status_changed_at": app.status_changed_at.isoformat() if app.status_changed_at else None,
    }
