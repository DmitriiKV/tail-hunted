from datetime import datetime

from sqlalchemy.exc import IntegrityError

from db import db_session
from db.models import Application, Invitation, Resume, Vacancy
from services.notification_service import create_notification


class InvitationError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def create_invitation(employer, company, vac_id, res_id, message=None):
    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id, comp_id=company.comp_id).first()
    if not vacancy:
        raise InvitationError("Вакансия не найдена", 404)

    resume = db_session.query(Resume).filter_by(res_id=res_id).first()
    if not resume:
        raise InvitationError("Резюме не найдено", 404)

    already_applied = db_session.query(Application).filter_by(res_id=res_id, vac_id=vac_id).first()
    if already_applied:
        raise InvitationError(
            "Кандидат уже откликнулся на эту вакансию, ответьте на отклик", 409
        )

    invitation = Invitation(
        vac_id=vac_id,
        res_id=res_id,
        employer_id=employer.user_id,
        candidate_id=resume.user_id,
        message=(message or "").strip()[:500] or None,
        status="pending",
    )

    try:
        db_session.add(invitation)
        db_session.flush()
        create_notification(
            user_id=resume.user_id,
            inv_id=invitation.inv_id,
            title="Новое приглашение",
            message=f"{company.comp_name} приглашает вас на вакансию «{vacancy.vac_title}»",
            notification_type="invitation_received",
        )
        db_session.commit()
    except IntegrityError:
        db_session.rollback()
        raise InvitationError("Это приглашение уже отправлено и ждёт ответа", 409)

    return invitation


def _load_pending(inv_id, **owner):
    invitation = db_session.query(Invitation).filter_by(inv_id=inv_id, **owner).first()
    if not invitation:
        raise InvitationError("Приглашение не найдено", 404)
    if invitation.status != "pending":
        raise InvitationError("По этому приглашению уже есть решение", 409)
    return invitation


def respond(candidate, inv_id, accept, reason=None):
    invitation = _load_pending(inv_id, candidate_id=candidate.user_id)
    now = datetime.utcnow()
    invitation.status = "accepted" if accept else "rejected"
    invitation.responded_at = now
    invitation.decline_reason = None if accept else (reason or "").strip()[:300] or None

    title = invitation.vacancy.vac_title
    create_notification(
        user_id=invitation.employer_id,
        inv_id=invitation.inv_id,
        title="Приглашение принято" if accept else "Приглашение отклонено",
        message=(
            f"Кандидат принял приглашение на вакансию «{title}»"
            if accept
            else f"Кандидат отклонил приглашение на вакансию «{title}»"
        ),
        notification_type="invitation_accepted" if accept else "invitation_rejected",
    )
    db_session.commit()
    return invitation


def cancel(employer, inv_id):
    invitation = _load_pending(inv_id, employer_id=employer.user_id)
    invitation.status = "cancelled"
    invitation.responded_at = datetime.utcnow()
    create_notification(
        user_id=invitation.candidate_id,
        inv_id=invitation.inv_id,
        title="Приглашение отозвано",
        message=f"Приглашение на вакансию «{invitation.vacancy.vac_title}» отозвано",
        notification_type="invitation_cancelled",
    )
    db_session.commit()
    return invitation


def invitation_to_dict(inv, side):
    data = {
        "inv_id": inv.inv_id,
        "vac_id": inv.vac_id,
        "res_id": inv.res_id,
        "status": inv.status,
        "message": inv.message,
        "decline_reason": inv.decline_reason,
        "created_at": inv.created_at.isoformat(),
        "responded_at": inv.responded_at.isoformat() if inv.responded_at else None,
        "vacancy": {
            "vac_title": inv.vacancy.vac_title,
            "vac_region": inv.vacancy.vac_region,
            "salary": inv.vacancy.salary,
        },
    }
    if side == "received":
        company = inv.vacancy.company
        data["company"] = {"comp_id": company.comp_id, "comp_name": company.comp_name}
    else:
        data["resume"] = {
            "res_title": inv.resume.res_title,
            "professional_area": inv.resume.professional_area,
        }
    return data
