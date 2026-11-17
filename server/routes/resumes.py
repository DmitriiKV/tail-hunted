from flask import Blueprint, request, jsonify, g
from datetime import datetime
from db import db_session
from db.models import Resume
from utils.auth_middleware import token_required
from services.search_service import apply_search

resumes_bp = Blueprint("resumes", __name__, url_prefix="/api/resumes")


def resume_to_dict(r):
    return {
        "res_id": r.res_id,
        "res_title": r.res_title,
        "gender": r.gender,
        "birth_date": r.birth_date.isoformat() if r.birth_date else None,
        "salary_expectation": r.salary_expectation,
        "professional_area": r.professional_area,
        "education": r.education,
        "skills": r.skills,
        "experience": r.experience,
    }


@resumes_bp.route("", methods=["POST"])
@token_required
def create_resume():
    user = g.current_user
    if user.role != "candidate":
        return jsonify({"error": "Только для соискателей"}), 403

    data = request.get_json() or {}
    if not data.get("res_title"):
        return jsonify({"error": "Поле 'res_title' обязательно"}), 400

    birth_date = None
    if data.get("birth_date"):
        try:
            birth_date = datetime.strptime(data["birth_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Дата должна быть в формате YYYY-MM-DD"}), 400

    resume = Resume(
        user_id=user.user_id,
        res_title=data["res_title"],
        gender=data.get("gender"),
        birth_date=birth_date,
        salary_expectation=data.get("salary_expectation"),
        professional_area=data.get("professional_area"),
        education=data.get("education"),
        skills=data.get("skills"),
        experience=data.get("experience"),
    )
    db_session.add(resume)
    db_session.commit()
    return jsonify(resume_to_dict(resume)), 201


@resumes_bp.route("/my", methods=["GET"])
@token_required
def get_my_resumes():
    user = g.current_user
    if user.role != "candidate":
        return jsonify({"error": "Только для соискателей"}), 403

    resumes = db_session.query(Resume).filter_by(user_id=user.user_id).all()
    return jsonify([resume_to_dict(r) for r in resumes])

@resumes_bp.route("/<int:res_id>", methods=["PATCH"])
@token_required
def update_resume(res_id):
    user = g.current_user
    if user.role != "candidate":
        return jsonify({"error": "Только для соискателей"}), 403

    resume = db_session.query(Resume).filter_by(
        res_id=res_id, user_id=user.user_id
    ).first()
    if not resume:
        return jsonify({"error": "Резюме не найдено"}), 404

    data = request.get_json() or {}

    if "birth_date" in data and data["birth_date"]:
        try:
            resume.birth_date = datetime.strptime(data["birth_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Дата должна быть в формате YYYY-MM-DD"}), 400

    for field in ["res_title", "gender", "salary_expectation",
                  "professional_area", "education", "skills", "experience"]:
        if field in data:
            setattr(resume, field, data[field])

    db_session.commit()
    return jsonify(resume_to_dict(resume))



@resumes_bp.route("", methods=["GET"])
def list_resumes():
    query = db_session.query(Resume)

    # Существующие фильтры
    filters = {
        "q": request.args.get("q", ""),
        "min_salary": request.args.get("min_salary", type=int),
        "max_salary": request.args.get("max_salary", type=int),
        "text": {
            "res_title": request.args.get("title", ""),
            "professional_area": request.args.get("specialization", ""),
            "skills": request.args.get("skills", ""),
            "education": request.args.get("education", ""),
            "experience": request.args.get("experience", ""),
        }
    }

    query = apply_search(
        query=query,
        model=Resume,
        search_fields=[
            "res_title",
            "professional_area",
            "education",
            "skills",
            "experience",
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
            Resume.res_created_at.asc(),
            Resume.res_id.asc()
        )
    elif sort == "salary_asc":
        query = query.order_by(
            Resume.salary_expectation.asc().nullslast(),
            Resume.res_created_at.desc()
        )
    elif sort == "salary_desc":
        query = query.order_by(
            Resume.salary_expectation.desc().nullslast(),
            Resume.res_created_at.desc()
        )
    else:
        query = query.order_by(
            Resume.res_created_at.desc(),
            Resume.res_id.desc()
        )

    # Получаем только записи текущей страницы
    resumes = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "items": [resume_to_dict(r) for r in resumes],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    })
