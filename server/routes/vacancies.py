from flask import Blueprint, g, jsonify, request
from sqlalchemy import func

from db import db_session
from db.models import Application, Vacancy
from utils.serializers import vacancy_to_dict
from services.application_service import company_response_stats
from services.search_service import apply_search
from utils.access import current_company, error, own_vacancy, role_required
from utils.auth_middleware import token_required
from utils.paging import paginate

vacancies_bp = Blueprint("vacancies", __name__, url_prefix="/api/vacancies")

STRING_FIELDS = (
    "vac_title", "specialization", "employment_type", "schedule",
    "experience_required", "skills_required", "vac_description", "vac_region",
)

ORDERINGS = {
    "newest": (Vacancy.vac_created_at.desc(), Vacancy.vac_id.desc()),
    "oldest": (Vacancy.vac_created_at.asc(), Vacancy.vac_id.asc()),
    "salary_asc": (Vacancy.salary.asc().nullslast(), Vacancy.vac_created_at.desc()),
    "salary_desc": (Vacancy.salary.desc().nullslast(), Vacancy.vac_created_at.desc()),
}


def parse_int_field(data, field, min_val=0, max_val=2_147_483_647):
    raw = data.get(field)
    if raw is None or raw == "":
        return None, None
    try:
        value = int(raw)
    except (ValueError, TypeError):
        return None, f"Поле '{field}' должно быть целым числом"
    if not min_val <= value <= max_val:
        return None, f"Поле '{field}' должно быть от {min_val} до {max_val}"
    return value, None


def parse_numbers(data):
    hiring_plan, err = parse_int_field(data, "hiring_plan", 1, 10000)
    if err:
        return None, None, err
    salary, err = parse_int_field(data, "salary", 0, 100_000_000)
    return hiring_plan, salary, err


@vacancies_bp.route("", methods=["POST"])
@token_required
@role_required("employer")
def create_vacancy():
    company = current_company()
    if not company:
        return error("Сначала создайте компанию", 400)

    data = request.get_json() or {}
    if not data.get("vac_title"):
        return error("Поле 'vac_title' обязательно", 400)

    hiring_plan, salary, err = parse_numbers(data)
    if err:
        return error(err, 400)
    if salary is None:
        return error("Укажите зарплату в вакансии", 400)

    vacancy = Vacancy(
        comp_id=company.comp_id,
        hiring_plan=hiring_plan,
        salary=salary,
        **{field: data.get(field) for field in STRING_FIELDS},
    )
    db_session.add(vacancy)
    db_session.commit()
    return jsonify(vacancy_to_dict(vacancy)), 201


@vacancies_bp.route("", methods=["GET"])
def list_vacancies():
    args = request.args
    query = db_session.query(Vacancy)

    if args.get("has_salary"):
        query = query.filter(Vacancy.salary.isnot(None))

    query = apply_search(
        query=query,
        model=Vacancy,
        search_fields=[*STRING_FIELDS],
        filters={
            "q": args.get("q", ""),
            "min_salary": args.get("min_salary", type=int),
            "max_salary": args.get("max_salary", type=int),
            "text": {
                "vac_region": args.get("region", ""),
                "specialization": args.get("specialization", ""),
                "employment_type": args.get("employment_type", ""),
                "schedule": args.get("schedule", ""),
                "experience_required": args.get("experience", ""),
                "skills_required": args.get("skills", ""),
            },
        },
    )
    return paginate(query, ORDERINGS, serialize=vacancy_to_dict)


@vacancies_bp.route("/my", methods=["GET"])
@token_required
@role_required("employer")
def my_vacancies():
    company = current_company()
    if not company:
        return jsonify([])
    vacancies = (
        db_session.query(Vacancy)
        .filter_by(comp_id=company.comp_id)
        .order_by(Vacancy.vac_created_at.desc())
        .all()
    )
    counts = {
        vac_id: (total, new)
        for vac_id, total, new in db_session.query(
            Application.vac_id,
            func.count(Application.app_id),
            func.count(Application.app_id).filter(Application.status == "pending"),
        )
        .filter(Application.vac_id.in_([v.vac_id for v in vacancies]))
        .group_by(Application.vac_id)
    }

    result = []
    for vacancy in vacancies:
        total, new = counts.get(vacancy.vac_id, (0, 0))
        result.append({**vacancy_to_dict(vacancy), "applications_total": total, "applications_new": new})
    return jsonify(result)


@vacancies_bp.route("/<int:vac_id>", methods=["GET"])
def get_vacancy(vac_id):
    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id).first()
    if not vacancy:
        return error("Вакансия не найдена", 404)

    result = vacancy_to_dict(vacancy)
    company = vacancy.company
    result["company"] = None
    if company:
        result["company"] = {
            "comp_id": company.comp_id,
            "comp_name": company.comp_name,
            "comp_region": company.comp_region,
            "address": company.address,
            "size": company.size,
            "comp_description": company.comp_description,
            "response_rate": company_response_stats(company.comp_id)["response_rate"],
        }
    return jsonify(result)


@vacancies_bp.route("/<int:vac_id>", methods=["PATCH"])
@token_required
@role_required("employer")
def update_vacancy(vac_id):
    _, vacancy = own_vacancy(vac_id)
    if not vacancy:
        return error("Вакансия не найдена или нет доступа", 404)

    data = request.get_json() or {}
    hiring_plan, salary, err = parse_numbers(data)
    if err:
        return error(err, 400)
    if "salary" in data and salary is None:
        return error("Укажите зарплату в вакансии", 400)

    for field in STRING_FIELDS:
        if field in data:
            setattr(vacancy, field, data[field])
    if "hiring_plan" in data:
        vacancy.hiring_plan = hiring_plan
    if "salary" in data:
        vacancy.salary = salary

    db_session.commit()
    return jsonify(vacancy_to_dict(vacancy))


@vacancies_bp.route("/<int:vac_id>", methods=["DELETE"])
@token_required
@role_required("employer")
def delete_vacancy(vac_id):
    _, vacancy = own_vacancy(vac_id)
    if not vacancy:
        return error("Вакансия не найдена или нет доступа", 404)

    db_session.delete(vacancy)
    db_session.commit()
    return jsonify({"ok": True})
