from datetime import datetime

from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload

from db import db_session
from db.models import Application, Notification, Resume, Vacancy
from utils.serializers import resume_to_dict
from services.application_service import STATUSES, application_to_dict
from services.matching_service import calculate_match
from services.notification_service import create_notification
from utils.access import error, own_vacancy, role_required
from utils.auth_middleware import token_required

applications_bp = Blueprint("applications", __name__, url_prefix="/api/applications")


@applications_bp.route("", methods=["POST"])
@token_required
@role_required("candidate")
def create_application():
    user = g.current_user
    vac_id = (request.get_json() or {}).get("vac_id")
    if not vac_id:
        return error("Не указан vac_id", 400)

    resume = db_session.query(Resume).filter_by(user_id=user.user_id).first()
    if not resume:
        return error("Сначала создайте резюме", 404)

    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id).first()
    if not vacancy:
        return error("Вакансия не найдена", 404)
    if db_session.query(Application).filter_by(res_id=resume.res_id, vac_id=vac_id).first():
        return error("Вы уже откликались на эту вакансию", 409)

    application = Application(res_id=resume.res_id, vac_id=vac_id, status="pending")
    try:
        db_session.add(application)
        db_session.flush()
        create_notification(
            user_id=vacancy.company.user_id,
            app_id=application.app_id,
            title="Новый отклик",
            message=f"На вакансию «{vacancy.vac_title}» откликнулся кандидат",
            notification_type="new_application",
        )
        db_session.commit()
    except IntegrityError:
        db_session.rollback()
        return error("Отклик на эту вакансию уже существует", 409)

    return jsonify({"message": "Отклик отправлен", "application": application_to_dict(application)}), 201


@applications_bp.route("/my", methods=["GET"])
@token_required
@role_required("candidate")
def get_my_applications():
    applications = (
        db_session.query(Application)
        .join(Resume, Application.res_id == Resume.res_id)
        .options(joinedload(Application.vacancy).joinedload(Vacancy.company))
        .filter(Resume.user_id == g.current_user.user_id)
        .order_by(Application.app_created_at.desc())
        .all()
    )

    result = []
    for app in applications:
        vacancy = app.vacancy
        result.append({
            **application_to_dict(app),
            "vacancy": {
                "vac_title": vacancy.vac_title,
                "vac_region": vacancy.vac_region,
                "salary": vacancy.salary,
            },
            "company": {"comp_name": vacancy.company.comp_name},
        })
    return jsonify({"applications": result})


@applications_bp.route("/vacancy/<int:vac_id>", methods=["GET"])
@token_required
@role_required("employer")
def get_vacancy_applications(vac_id):
    company, vacancy = own_vacancy(vac_id)
    if not vacancy:
        return error("Вакансия не найдена или нет доступа", 404)

    applications = (
        db_session.query(Application)
        .options(joinedload(Application.resume))
        .filter_by(vac_id=vac_id)
        .all()
    )

    result = []
    for app in applications:
        match = calculate_match(app.resume, vacancy)
        result.append({
            **application_to_dict(app),
            "score": round(match["score"]),
            "missing_skills": match["missing_skills"],
            "resume": {
                "res_id": app.resume.res_id,
                "res_title": app.resume.res_title,
                "professional_area": app.resume.professional_area,
                "experience_level": app.resume.experience_level,
                "salary_expectation": app.resume.salary_expectation,
            },
        })

    result.sort(key=lambda item: item["score"], reverse=True)
    return jsonify({"applications": result})


@applications_bp.route("/<int:app_id>", methods=["DELETE"])
@token_required
@role_required("candidate")
def delete_my_application(app_id):
    application = (
        db_session.query(Application)
        .join(Resume, Application.res_id == Resume.res_id)
        .filter(
            Application.app_id == app_id,
            Resume.user_id == g.current_user.user_id,
        )
        .first()
    )
    if not application:
        return error("Отклик не найден", 404)

    # Candidate may withdraw only an application the employer has not viewed.
    if application.status != "pending":
        return error("Отклик уже просмотрен или обработан — отменить его нельзя", 409)

    # Notifications reference applications without ON DELETE CASCADE.
    db_session.query(Notification).filter(
        Notification.app_id == application.app_id
    ).delete(synchronize_session=False)

    db_session.delete(application)
    db_session.commit()
    return jsonify({"message": "Отклик отменён"})


@applications_bp.route("/<int:app_id>/status", methods=["PATCH"])
@token_required
@role_required("employer")
def update_application_status(app_id):
    data = request.get_json() or {}
    new_status = data.get("status")

    if new_status not in STATUSES:
        return error("Некорректный статус", 400)

    application = db_session.query(Application).filter_by(app_id=app_id).first()
    if not application:
        return error("Отклик не найден", 404)

    _, vacancy = own_vacancy(application.vac_id)
    if not vacancy:
        return error("Нет доступа к этому отклику", 403)

    if application.status == new_status:
        return jsonify(application_to_dict(application))

    application.status = new_status
    application.status_changed_at = datetime.utcnow()

    candidate_id = application.resume.user_id
    if new_status == "invited":
        create_notification(
            user_id=candidate_id,
            app_id=app_id,
            title="Вас пригласили на собеседование",
            message=f"Работодатель пригласил вас по вакансии «{vacancy.vac_title}»",
            notification_type="application_invited",
        )
    elif new_status == "rejected":
        create_notification(
            user_id=candidate_id,
            app_id=app_id,
            title="Изменился статус отклика",
            message=f"По вакансии «{vacancy.vac_title}» получен отказ",
            notification_type="application_rejected",
        )

    db_session.commit()
    return jsonify(application_to_dict(application))


@applications_bp.route("/<int:app_id>/resume", methods=["GET"])
@token_required
@role_required("employer")
def get_application_resume(app_id):
    application = db_session.query(Application).filter_by(app_id=app_id).first()
    if not application:
        return error("Отклик не найден", 404)

    _, vacancy = own_vacancy(application.vac_id)
    if not vacancy:
        return error("Нет доступа к этому резюме", 403)

    if application.status == "pending":
        application.status = "viewed"
        application.status_changed_at = datetime.utcnow()
        db_session.commit()

    return jsonify({
        "application": application_to_dict(application),
        "resume": resume_to_dict(application.resume),
    })
