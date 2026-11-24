from flask import Blueprint, g, jsonify, request
from sqlalchemy import or_

from db import db_session
from db.models import Company, Resume, Vacancy
from utils.serializers import resume_to_dict, vacancy_to_dict
from services.matching_service import (
    calculate_match,
    rank_resumes_for_vacancy,
    rank_vacancies_for_resume,
)
from utils.access import error, own_vacancy, role_required
from utils.auth_middleware import token_required

matching_bp = Blueprint("matching", __name__, url_prefix="/api/matching")

VACANCY_TEXT_FILTERS = {
    "skills": Vacancy.skills_required,
}


def _experience_matches(value, args):
    exp_type = args.get("experience_type", "").strip()
    if not exp_type:
        return True
    import re
    text = (value or "").strip().lower()
    if exp_type == "none":
        return text == "без опыта"
    range_match = re.match(r"От\s+(\d+)\s+до\s+(\d+)\s+лет?", value or "", re.I)
    more_match = re.match(r"Более\s+(\d+)\s+лет?", value or "", re.I)
    if text == "без опыта":
        candidate_min, candidate_max = 0, 0
    elif range_match:
        candidate_min, candidate_max = int(range_match.group(1)), int(range_match.group(2))
    elif more_match:
        candidate_min, candidate_max = int(more_match.group(1)) + 1, float("inf")
    else:
        return False

    if exp_type == "range":
        min_value = args.get("experience_min", type=int)
        max_value = args.get("experience_max", type=int)
        if min_value is None or max_value is None or min_value > max_value:
            return False
        return candidate_min <= max_value and candidate_max >= min_value
    if exp_type == "more":
        threshold = args.get("experience_more", type=int)
        return threshold is not None and candidate_min > threshold
    return True


def apply_vacancy_filters(query):
    args = request.args
    query = query.outerjoin(Company, Vacancy.company)

    search_text = args.get("q", "").strip()
    if search_text:
        pattern = f"%{search_text}%"
        query = query.filter(or_(
            Vacancy.vac_title.ilike(pattern),
            Vacancy.specialization.ilike(pattern),
            Vacancy.employment_type.ilike(pattern),
            Vacancy.schedule.ilike(pattern),
            Vacancy.experience_required.ilike(pattern),
            Vacancy.skills_required.ilike(pattern),
            Vacancy.vac_description.ilike(pattern),
            Vacancy.vac_region.ilike(pattern),
            Company.comp_name.ilike(pattern),
            Company.comp_region.ilike(pattern),
            Company.comp_description.ilike(pattern),
        ))

    region = args.get("region", "").strip()
    if region:
        query = query.filter(Vacancy.vac_region == region)

    for name, column in VACANCY_TEXT_FILTERS.items():
        value = args.get(name, "").strip()
        if value:
            query = query.filter(column.ilike(f"%{value}%"))

    employment_type = args.get("employment_type", "").strip()
    if employment_type:
        query = query.filter(Vacancy.employment_type == employment_type)

    schedule = args.get("schedule", "").strip()
    if schedule:
        query = query.filter(Vacancy.schedule == schedule)

    min_salary = args.get("min_salary", type=float)
    if min_salary is not None:
        query = query.filter(Vacancy.salary >= min_salary)

    if args.get("experience_type"):
        matching_ids = [
            vacancy.vac_id
            for vacancy in query.all()
            if _experience_matches(vacancy.experience_required, args)
        ]
        query = db_session.query(Vacancy).filter(Vacancy.vac_id.in_(matching_ids))

    return query


def my_resume():
    return db_session.query(Resume).filter_by(user_id=g.current_user.user_id).first()


def score_payload(match):
    return {
        "score": match["score"],
        "matched_skills": match["matched_skills"],
        "missing_skills": match["missing_skills"],
        "details": match["details"],
    }


@matching_bp.route("/vacancies", methods=["GET"])
@token_required
@role_required("candidate")
def get_recommended_vacancies():
    resume = my_resume()
    if not resume:
        return error("Сначала создайте резюме", 404)

    query = apply_vacancy_filters(db_session.query(Vacancy))
    ranked = rank_vacancies_for_resume(resume, query.all())
    return jsonify([
        {
            "vacancy": vacancy_to_dict(item["vacancy"], with_company_name=True),
            "match": score_payload(item),
        }
        for item in ranked
    ])


@matching_bp.route("/vacancies/<int:vac_id>/score", methods=["GET"])
@token_required
@role_required("candidate")
def get_vacancy_match_score(vac_id):
    resume = my_resume()
    if not resume:
        return error("Сначала создайте резюме", 404)

    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id).first()
    if not vacancy:
        return error("Вакансия не найдена", 404)

    return jsonify(score_payload(calculate_match(resume, vacancy)))


@matching_bp.route("/resumes/<int:res_id>/score/<int:vac_id>", methods=["GET"])
@token_required
@role_required("employer")
def get_resume_match_score(res_id, vac_id):
    _, vacancy = own_vacancy(vac_id)
    if not vacancy:
        return error("Вакансия не найдена", 404)

    resume = db_session.query(Resume).filter_by(res_id=res_id).first()
    if not resume:
        return error("Резюме не найдено", 404)

    return jsonify(score_payload(calculate_match(resume, vacancy)))


@matching_bp.route("/resumes/<int:vac_id>", methods=["GET"])
@token_required
@role_required("employer")
def get_recommended_resumes(vac_id):
    _, vacancy = own_vacancy(vac_id)
    if not vacancy:
        return error("Вакансия не найдена", 404)

    ranked = rank_resumes_for_vacancy(vacancy, db_session.query(Resume).all())
    return jsonify([
        {
            "resume": resume_to_dict(item["resume"]),
            "match": score_payload(item),
        }
        for item in ranked
    ])
