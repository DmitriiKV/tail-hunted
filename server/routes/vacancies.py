from flask import Blueprint, request, jsonify, g
from db import db_session
from db.models import Vacancy, Company
from utils.auth_middleware import token_required
from services.search_service import apply_search

vacancies_bp = Blueprint("vacancies", __name__, url_prefix="/api/vacancies")


def vacancy_to_dict(v):
    return {
        "vac_id": v.vac_id,
        "comp_id": v.comp_id,
        "vac_title": v.vac_title,
        "specialization": v.specialization,
        "hiring_plan": v.hiring_plan,
        "employment_type": v.employment_type,
        "schedule": v.schedule,
        "salary": v.salary,
        "experience_required": v.experience_required,
        "skills_required": v.skills_required,
        "vac_description": v.vac_description,
        "vac_region": v.vac_region,
        "vac_created_at": v.vac_created_at.isoformat() if v.vac_created_at else None,
    }


def parse_int_field(data, field, min_val=0, max_val=2_147_483_647):
    raw = data.get(field)
    if raw is None or raw == "":
        return None, None
    try:
        value = int(raw)
    except (ValueError, TypeError):
        return None, f"Поле '{field}' должно быть целым числом"
    if value < min_val or value > max_val:
        return None, f"Поле '{field}' должно быть от {min_val} до {max_val}"
    return value, None


@vacancies_bp.route("", methods=["POST"])
@token_required
def create_vacancy():
    user = g.current_user
    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    company = db_session.query(Company).filter_by(user_id=user.user_id).first()
    if not company:
        return jsonify({"error": "Сначала создайте компанию"}), 400

    data = request.get_json() or {}
    if not data.get("vac_title"):
        return jsonify({"error": "Поле 'vac_title' обязательно"}), 400

    hiring_plan, err = parse_int_field(data, "hiring_plan", 1, 10000)
    if err:
        return jsonify({"error": err}), 400

    salary, err = parse_int_field(data, "salary", 0, 100_000_000)
    if err:
        return jsonify({"error": err}), 400

    vacancy = Vacancy(
        comp_id=company.comp_id,
        vac_title=data["vac_title"],
        specialization=data.get("specialization"),
        hiring_plan=hiring_plan,
        employment_type=data.get("employment_type"),
        schedule=data.get("schedule"),
        salary=salary,
        experience_required=data.get("experience_required"),
        skills_required=data.get("skills_required"),
        vac_description=data.get("vac_description"),
        vac_region=data.get("vac_region"),
    )
    db_session.add(vacancy)
    db_session.commit()
    return jsonify(vacancy_to_dict(vacancy)), 201


@vacancies_bp.route("", methods=["GET"])
def list_vacancies():
    query = db_session.query(Vacancy)

    # Существующие фильтры
    filters = {
        "q": request.args.get("q", ""),
        "min_salary": request.args.get("min_salary", type=int),
        "max_salary": request.args.get("max_salary", type=int),
        "text": {
            "vac_region": request.args.get("region", ""),
            "specialization": request.args.get("specialization", ""),
            "employment_type": request.args.get("employment_type", ""),
            "schedule": request.args.get("schedule", ""),
            "experience_required": request.args.get("experience", ""),
            "skills_required": request.args.get("skills", ""),
        }
    }

    query = apply_search(
        query=query,
        model=Vacancy,
        search_fields=[
            "vac_title",
            "specialization",
            "employment_type",
            "schedule",
            "experience_required",
            "skills_required",
            "vac_description",
            "vac_region",
        ],
        filters=filters,
    )

    # Пагинация
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    page = max(page or 1, 1)
    per_page = min(max(per_page or 10, 1), 50)

    # Считаем количество записей после применения фильтров
    total = query.count()
    pages = (total + per_page - 1) // per_page

    # Сортировка
    sort = request.args.get("sort", "newest")

    if sort == "oldest":
        query = query.order_by(
            Vacancy.vac_created_at.asc(),
            Vacancy.vac_id.asc()
        )
    elif sort == "salary_asc":
        query = query.order_by(
            Vacancy.salary.asc().nullslast(),
            Vacancy.vac_created_at.desc()
        )
    elif sort == "salary_desc":
        query = query.order_by(
            Vacancy.salary.desc().nullslast(),
            Vacancy.vac_created_at.desc()
        )
    else:
        query = query.order_by(
            Vacancy.vac_created_at.desc(),
            Vacancy.vac_id.desc()
        )

    # Получаем только записи текущей страницы
    vacancies = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "items": [vacancy_to_dict(v) for v in vacancies],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    })

@vacancies_bp.route("/my", methods=["GET"])
@token_required
def my_vacancies():
    user = g.current_user
    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    company = db_session.query(Company).filter_by(user_id=user.user_id).first()
    if not company:
        return jsonify([])

    vacancies = db_session.query(Vacancy).filter_by(comp_id=company.comp_id).all()
    return jsonify([vacancy_to_dict(v) for v in vacancies])


@vacancies_bp.route("/<int:vac_id>", methods=["GET"])
def get_vacancy(vac_id):
    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id).first()
    if not vacancy:
        return jsonify({"error": "Вакансия не найдена"}), 404
    return jsonify(vacancy_to_dict(vacancy))


@vacancies_bp.route("/<int:vac_id>", methods=["PATCH"])
@token_required
def update_vacancy(vac_id):
    user = g.current_user
    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id).first()
    if not vacancy:
        return jsonify({"error": "Вакансия не найдена"}), 404

    company = db_session.query(Company).filter_by(user_id=user.user_id).first()
    if not company or vacancy.comp_id != company.comp_id:
        return jsonify({"error": "Нет доступа"}), 403

    data = request.get_json() or {}

    hiring_plan, err = parse_int_field(data, "hiring_plan", 1, 10000)
    if err:
        return jsonify({"error": err}), 400

    salary, err = parse_int_field(data, "salary", 0, 100_000_000)
    if err:
        return jsonify({"error": err}), 400

    string_fields = [
        "vac_title", "specialization", "employment_type", "schedule",
        "experience_required", "skills_required", "vac_description", "vac_region",
    ]
    for field in string_fields:
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
def delete_vacancy(vac_id):
    user = g.current_user
    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id).first()
    if not vacancy:
        return jsonify({"error": "Вакансия не найдена"}), 404

    company = db_session.query(Company).filter_by(user_id=user.user_id).first()
    if not company or vacancy.comp_id != company.comp_id:
        return jsonify({"error": "Нет доступа"}), 403

    db_session.delete(vacancy)
    db_session.commit()
    return jsonify({"ok": True})