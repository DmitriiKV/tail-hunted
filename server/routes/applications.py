
from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError

from db import db_session
from db.models import Application, Resume, Vacancy, Company, User
from utils.auth_middleware import token_required


applications_bp = Blueprint(
    "applications",
    __name__,
    url_prefix="/api/applications"
)


# Создать отклик
@applications_bp.route("", methods=["POST"])
@token_required
def create_application():
    user = g.current_user

    if user.role != "candidate":
        return jsonify({"error": "Только соискатели могут откликаться"}), 403

    data = request.get_json() or {}
    vac_id = data.get("vac_id")

    if not vac_id:
        return jsonify({"error": "Не указан vac_id"}), 400

    resume = db_session.query(Resume).filter_by(
        user_id=user.user_id
    ).first()

    if not resume:
        return jsonify({"error": "Сначала создайте резюме"}), 404

    vacancy = db_session.query(Vacancy).filter_by(
        vac_id=vac_id
    ).first()

    if not vacancy:
        return jsonify({"error": "Вакансия не найдена"}), 404

    existing = db_session.query(Application).filter_by(
        res_id=resume.res_id,
        vac_id=vac_id
    ).first()

    if existing:
        return jsonify({"error": "Вы уже откликались на эту вакансию"}), 409

    application = Application(
        res_id=resume.res_id,
        vac_id=vac_id,
        status="pending"
    )

    try:
        db_session.add(application)
        db_session.commit()
    except IntegrityError:
        db_session.rollback()
        return jsonify({"error": "Отклик на эту вакансию уже существует"}), 409

    return jsonify({
        "message": "Отклик успешно создан",
        "application": {
            "app_id": application.app_id,
            "res_id": application.res_id,
            "vac_id": application.vac_id,
            "status": application.status
        }
    }), 201


# Получить отклики текущего соискателя
@applications_bp.route("/my", methods=["GET"])
@token_required
def get_my_applications():
    user = g.current_user

    if user.role != "candidate":
        return jsonify({"error": "Доступ только для соискателей"}), 403

    applications = (
        db_session.query(Application)
        .join(Resume, Application.res_id == Resume.res_id)
        .filter(Resume.user_id == user.user_id)
        .all()
    )

    result = []

    for app in applications:
        vacancy = db_session.query(Vacancy).filter_by(
            vac_id=app.vac_id
        ).first()

        company = None
        if vacancy:
            company = db_session.query(Company).filter_by(
                comp_id=vacancy.comp_id
            ).first()

        result.append({
            "app_id": app.app_id,
            "res_id": app.res_id,
            "vac_id": app.vac_id,
            "status": app.status,
            "app_created_at": app.app_created_at.isoformat(),
            "vacancy": {
                "vac_title": vacancy.vac_title,
                "vac_region": vacancy.vac_region
            } if vacancy else None,
            "company": {
                "comp_name": company.comp_name
            } if company else None
        })

    return jsonify({"applications": result}), 200


# Получить отклики на вакансию (для работодателя)
@applications_bp.route("/vacancy/<int:vac_id>", methods=["GET"])
@token_required
def get_vacancy_applications(vac_id):
    user = g.current_user

    if user.role != "employer":
        return jsonify({"error": "Доступ только для работодателей"}), 403

    company = db_session.query(Company).filter_by(
        user_id=user.user_id
    ).first()

    if not company:
        return jsonify({"error": "Компания не найдена"}), 404

    vacancy = db_session.query(Vacancy).filter_by(
        vac_id=vac_id,
        comp_id=company.comp_id
    ).first()

    if not vacancy:
        return jsonify({"error": "Вакансия не найдена или нет доступа"}), 404

    applications = db_session.query(Application).filter_by(
        vac_id=vac_id
    ).all()

    result = []

    for app in applications:
        resume = db_session.query(Resume).filter_by(
            res_id=app.res_id
        ).first()

        if not resume:
            continue

        result.append({
            "app_id": app.app_id,
            "res_id": app.res_id,
            "vac_id": app.vac_id,
            "status": app.status,
            "app_created_at": app.app_created_at.isoformat(),
            "resume": {
                "res_id": resume.res_id,
                "res_title": resume.res_title,
                "gender": resume.gender,
                "birth_date": (
                    resume.birth_date.isoformat()
                    if resume.birth_date else None
                ),
                "salary_expectation": resume.salary_expectation,
                "professional_area": resume.professional_area,
                "education": resume.education,
                "skills": resume.skills,
                "experience": resume.experience
            }
        })

    return jsonify({"applications": result}), 200


# Изменить статус отклика
@applications_bp.route("/<int:app_id>/status", methods=["PATCH"])
@token_required
def update_application_status(app_id):
    user = g.current_user

    if user.role != "employer":
        return jsonify({"error": "Доступ только для работодателей"}), 403

    data = request.get_json() or {}
    new_status = data.get("status")

    allowed_statuses = ["pending", "viewed", "invited", "rejected"]

    if new_status not in allowed_statuses:
        return jsonify({"error": "Некорректный статус"}), 400

    company = db_session.query(Company).filter_by(
        user_id=user.user_id
    ).first()

    if not company:
        return jsonify({"error": "Компания не найдена"}), 404

    application = db_session.query(Application).filter_by(
        app_id=app_id
    ).first()

    if not application:
        return jsonify({"error": "Отклик не найден"}), 404

    vacancy = db_session.query(Vacancy).filter_by(
        vac_id=application.vac_id,
        comp_id=company.comp_id
    ).first()

    if not vacancy:
        return jsonify({"error": "Нет доступа к этому отклику"}), 403

    application.status = new_status
    db_session.commit()

    return jsonify({
        "message": "Статус отклика обновлён",
        "app_id": application.app_id,
        "status": application.status
    }), 200



# Получить полное резюме из отклика.
# При первом просмотре статус меняется на viewed.
@applications_bp.route("/<int:app_id>/resume", methods=["GET"])
@token_required
def get_application_resume(app_id):
    user = g.current_user

    if user.role != "employer":
        return jsonify({"error": "Доступ только для работодателей"}), 403

    company = db_session.query(Company).filter_by(
        user_id=user.user_id
    ).first()

    if not company:
        return jsonify({"error": "Компания не найдена"}), 404

    application = db_session.query(Application).filter_by(
        app_id=app_id
    ).first()

    if not application:
        return jsonify({"error": "Отклик не найден"}), 404

    # Проверяем, что отклик относится к вакансии этой компании
    vacancy = db_session.query(Vacancy).filter_by(
        vac_id=application.vac_id,
        comp_id=company.comp_id
    ).first()

    if not vacancy:
        return jsonify({"error": "Нет доступа к этому резюме"}), 403

    resume = db_session.query(Resume).filter_by(
        res_id=application.res_id
    ).first()

    if not resume:
        return jsonify({"error": "Резюме не найдено"}), 404

    # Меняем только pending на viewed.
    # invited и rejected остаются без изменений.
    if application.status == "pending":
        application.status = "viewed"
        db_session.commit()

    return jsonify({
        "application": {
            "app_id": application.app_id,
            "status": application.status
        },
        "resume": {
            "res_id": resume.res_id,
            "res_title": resume.res_title,
            "gender": resume.gender,
            "birth_date": (
                resume.birth_date.isoformat()
                if resume.birth_date else None
            ),
            "salary_expectation": resume.salary_expectation,
            "professional_area": resume.professional_area,
            "education": resume.education,
            "skills": resume.skills,
            "experience": resume.experience
        }
    }), 200
