from flask import Blueprint, g, jsonify, request
from sqlalchemy.orm import joinedload

from db import db_session
from db.models import Invitation, Notification, Vacancy
from services import invitation_service as service
from services.invitation_service import InvitationError, invitation_to_dict
from utils.access import current_company, error, role_required
from utils.auth_middleware import token_required

invitations_bp = Blueprint("invitations", __name__, url_prefix="/api/invitations")


def _listing(side, **owner):
    items = (
        db_session.query(Invitation)
        .options(joinedload(Invitation.vacancy).joinedload(Vacancy.company), joinedload(Invitation.resume))
        .filter_by(**owner)
        .order_by(Invitation.created_at.desc())
        .all()
    )
    invitations = [invitation_to_dict(i, side) for i in items]
    if side == "received":
        unread_invitation_ids = {
            inv_id
            for (inv_id,) in db_session.query(Notification.inv_id)
            .filter(
                Notification.user_id == g.current_user.user_id,
                Notification.notification_type == "invitation_received",
                Notification.is_read.is_(False),
                Notification.inv_id.isnot(None),
            )
            .all()
        }
        for item in invitations:
            item["is_new"] = item["inv_id"] in unread_invitation_ids
    return jsonify({"invitations": invitations})


@invitations_bp.route("", methods=["POST"])
@token_required
@role_required("employer")
def create_invitation():
    company = current_company()
    if not company:
        return error("Сначала создайте компанию", 400)

    data = request.get_json() or {}
    if not data.get("vac_id") or not data.get("res_id"):
        return error("Нужны vac_id и res_id", 400)

    try:
        invitation = service.create_invitation(
            g.current_user, company, data["vac_id"], data["res_id"], data.get("message")
        )
    except InvitationError as exc:
        return error(exc.message, exc.status)

    return jsonify(invitation_to_dict(invitation, "sent")), 201


@invitations_bp.route("/sent", methods=["GET"])
@token_required
@role_required("employer")
def sent():
    return _listing("sent", employer_id=g.current_user.user_id)


@invitations_bp.route("/received", methods=["GET"])
@token_required
@role_required("candidate")
def received():
    return _listing("received", candidate_id=g.current_user.user_id)


@invitations_bp.route("/received/mark-viewed", methods=["PATCH"])
@token_required
@role_required("candidate")
def mark_received_viewed():
    db_session.query(Notification).filter(
        Notification.user_id == g.current_user.user_id,
        Notification.notification_type == "invitation_received",
        Notification.is_read.is_(False),
    ).update({Notification.is_read: True}, synchronize_session=False)
    db_session.commit()
    return jsonify({"ok": True})


@invitations_bp.route("/<int:inv_id>/respond", methods=["PATCH"])
@token_required
@role_required("candidate")
def respond(inv_id):
    data = request.get_json() or {}
    decision = data.get("decision")
    if decision not in ("accept", "reject"):
        return error("decision должен быть accept или reject", 400)

    try:
        invitation = service.respond(
            g.current_user, inv_id, decision == "accept", data.get("reason")
        )
    except InvitationError as exc:
        return error(exc.message, exc.status)

    return jsonify(invitation_to_dict(invitation, "received"))


@invitations_bp.route("/<int:inv_id>/cancel", methods=["PATCH"])
@token_required
@role_required("employer")
def cancel(inv_id):
    try:
        invitation = service.cancel(g.current_user, inv_id)
    except InvitationError as exc:
        return error(exc.message, exc.status)

    return jsonify(invitation_to_dict(invitation, "sent"))
