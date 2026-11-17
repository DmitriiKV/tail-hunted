
from flask import Blueprint, jsonify, g, request
from sqlalchemy import or_

from db import db_session
from db.models import Resume, Vacancy, Company
from utils.auth_middleware import token_required

from services.matching_service import (
    rank_vacancies_for_resume,
    rank_resumes_for_vacancy,
    calculate_match,
)


matching_bp = Blueprint(
    "matching",
    __name__,
    url_prefix="/api/matching",
)


def resume_to_dict(resume):
    return {
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
        "experience": resume.experience,
        "experience_level": resume.experience_level,
        "preferred_region": resume.preferred_region,
    }


def vacancy_to_dict(vacancy):
    return {
        "vac_id": vacancy.vac_id,
        "vac_title": vacancy.vac_title,
        "specialization": vacancy.specialization,
        "hiring_plan": vacancy.hiring_plan,
        "employment_type": vacancy.employment_type,
        "schedule": vacancy.schedule,
        "salary": vacancy.salary,
        "experience_required": vacancy.experience_required,
        "skills_required": vacancy.skills_required,
        "vac_description": vacancy.vac_description,
        "vac_region": vacancy.vac_region,
        "comp_id": vacancy.comp_id,
        "comp_name": (
            vacancy.company.comp_name
            if vacancy.company else None
        ),
    }


def apply_vacancy_filters(query):
    """
    Применяет поисковые фильтры к рекомендованной ленте вакансий.

    Поддерживаемые параметры:
    q, region, specialization, min_salary,
    employment_type, schedule, experience, skills.
    """

    q = request.args.get("q", "").strip()
    region = request.args.get("region", "").strip()
    specialization = request.args.get("specialization", "").strip()
    min_salary = request.args.get("min_salary", "").strip()
    employment_type = request.args.get("employment_type", "").strip()
    schedule = request.args.get("schedule", "").strip()
    experience = request.args.get("experience", "").strip()
    skills = request.args.get("skills", "").strip()

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Vacancy.vac_title.ilike(search),
                Vacancy.vac_description.ilike(search),
            )
        )

    if region:
        query = query.filter(
            Vacancy.vac_region.ilike(f"%{region}%")
        )

    if specialization:
        query = query.filter(
            Vacancy.specialization.ilike(f"%{specialization}%")
        )

    if min_salary:
        try:
            salary_value = float(min_salary)
            query = query.filter(
                Vacancy.salary >= salary_value
            )
        except ValueError:
            pass

    if employment_type:
        query = query.filter(
            Vacancy.employment_type == employment_type
        )

    if schedule:
        query = query.filter(
            Vacancy.schedule.ilike(f"%{schedule}%")
        )

    if experience:
        query = query.filter(
            Vacancy.experience_required.ilike(f"%{experience}%")
        )

    if skills:
        query = query.filter(
            Vacancy.skills_required.ilike(f"%{skills}%")
        )

    return query


@matching_bp.route("/vacancies", methods=["GET"])
@token_required
def get_recommended_vacancies():
    """
    Рекомендованная лента вакансий для текущего соискателя.

    Вакансии сортируются по совместимости.
    Поиск и фильтры применяются до расчёта совпадения.
    """

    user = g.current_user

    if user.role != "candidate":
        return jsonify({
            "error": "Только для соискателей"
        }), 403

    resume = (
        db_session.query(Resume)
        .filter_by(user_id=user.user_id)
        .first()
    )

    if not resume:
        return jsonify({
            "error": "Сначала создайте резюме"
        }), 404

    vacancies_query = db_session.query(Vacancy)

    vacancies_query = apply_vacancy_filters(
        vacancies_query
    )

    vacancies = vacancies_query.all()

    results = rank_vacancies_for_resume(
        resume,
        vacancies,
    )

    # Процент и объяснение совпадения не нужны в ленте.
    # Они будут запрашиваться отдельно на странице вакансии.
    return jsonify([
        {
            "vacancy": vacancy_to_dict(item["vacancy"])
        }
        for item in results
    ])


@matching_bp.route(
    "/vacancies/<int:vac_id>/score",
    methods=["GET"]
)
@token_required
def get_vacancy_match_score(vac_id):
    """Возвращает процент совпадения вакансии с резюме соискателя."""

    user = g.current_user

    if user.role != "candidate":
        return jsonify({
            "error": "Только для соискателей"
        }), 403

    resume = (
        db_session.query(Resume)
        .filter_by(user_id=user.user_id)
        .first()
    )

    if not resume:
        return jsonify({
            "error": "Сначала создайте резюме"
        }), 404

    vacancy = (
        db_session.query(Vacancy)
        .filter_by(vac_id=vac_id)
        .first()
    )

    if not vacancy:
        return jsonify({
            "error": "Вакансия не найдена"
        }), 404

    match = calculate_match(resume, vacancy)

    return jsonify({
        "score": match["score"]
    })


@matching_bp.route(
    "/resumes/<int:res_id>/score/<int:vac_id>",
    methods=["GET"]
)
@token_required
def get_resume_match_score(res_id, vac_id):
    """
    Возвращает процент совпадения резюме с вакансией работодателя.

    Работодатель может получить оценку только для собственной вакансии.
    """

    user = g.current_user

    if user.role != "employer":
        return jsonify({
            "error": "Только для работодателей"
        }), 403

    company = (
        db_session.query(Company)
        .filter_by(user_id=user.user_id)
        .first()
    )

    if not company:
        return jsonify({
            "error": "Компания не найдена"
        }), 404

    vacancy = (
        db_session.query(Vacancy)
        .filter_by(
            vac_id=vac_id,
            comp_id=company.comp_id,
        )
        .first()
    )

    if not vacancy:
        return jsonify({
            "error": "Вакансия не найдена"
        }), 404

    resume = (
        db_session.query(Resume)
        .filter_by(res_id=res_id)
        .first()
    )

    if not resume:
        return jsonify({
            "error": "Резюме не найдено"
        }), 404

    match = calculate_match(resume, vacancy)

    return jsonify({
        "score": match["score"]
    })


@matching_bp.route(
    "/resumes/<int:vac_id>",
    methods=["GET"]
)
@token_required
def get_recommended_resumes(vac_id):
    """
    Подходящие резюме для вакансии текущего работодателя.
    """

    user = g.current_user

    if user.role != "employer":
        return jsonify({
            "error": "Только для работодателей"
        }), 403

    company = (
        db_session.query(Company)
        .filter_by(user_id=user.user_id)
        .first()
    )

    if not company:
        return jsonify({
            "error": "Компания не найдена"
        }), 404

    vacancy = (
        db_session.query(Vacancy)
        .filter_by(
            vac_id=vac_id,
            comp_id=company.comp_id,
        )
        .first()
    )

    if not vacancy:
        return jsonify({
            "error": "Вакансия не найдена"
        }), 404

    resumes = db_session.query(Resume).all()

    results = rank_resumes_for_vacancy(
        vacancy,
        resumes,
    )

    # В ленте возвращаем только данные резюме.
    # Процент будет запрашиваться отдельно на странице резюме.
    return jsonify([
        {
            "resume": resume_to_dict(item["resume"])
        }
        for item in results
    ])
