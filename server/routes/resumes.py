from flask import Blueprint, request, jsonify, g
from datetime import datetime
from db import db_session
from db.models import Resume, ContactAccessRequest, Notification
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
        "experience_level": r.experience_level,
        "preferred_region": r.preferred_region or "Любой регион",
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
        experience_level=data.get("experience_level"),
        preferred_region=data.get("preferred_region") or "Любой регион",
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

    for field in [
        "res_title",
        "gender",
        "salary_expectation",
        "professional_area",
        "education",
        "skills",
        "experience",
        "experience_level",
        "preferred_region",
    ]:
        if field in data:
            setattr(resume, field, data[field])

    db_session.commit()
    return jsonify(resume_to_dict(resume))



@resumes_bp.route("", methods=["GET"])
@token_required
def list_resumes():
    user = g.current_user

    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

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

@resumes_bp.route("/<int:res_id>", methods=["GET"])
@token_required
def get_resume(res_id):
    user = g.current_user

    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    resume = db_session.query(Resume).filter_by(res_id=res_id).first()

    if not resume:
        return jsonify({"error": "Резюме не найдено"}), 404

    result = resume_to_dict(resume)

    # Проверяем, разрешил ли кандидат этому работодателю
    # просматривать свой email
    approved_request = db_session.query(ContactAccessRequest).filter_by(
        resume_id=resume.res_id,
        employer_id=user.user_id,
        status="approved"
    ).first()

    result["contact_email"] = (
        resume.user.user_email if approved_request else None
    )

    return jsonify(result), 200

@resumes_bp.route("/<int:res_id>/contact-request", methods=["POST"])
@token_required
def request_resume_contacts(res_id):
    user = g.current_user

    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    resume = db_session.query(Resume).filter_by(res_id=res_id).first()

    if not resume:
        return jsonify({"error": "Резюме не найдено"}), 404

    # Нельзя запрашивать контакты собственного резюме
    if resume.user_id == user.user_id:
        return jsonify({"error": "Нельзя запросить контакты собственного резюме"}), 400

    existing_request = db_session.query(ContactAccessRequest).filter_by(
        resume_id=resume.res_id,
        employer_id=user.user_id
    ).first()

    if existing_request:
        if existing_request.status == "pending":
            return jsonify({"error": "Запрос уже отправлен"}), 409

        if existing_request.status == "approved":
            return jsonify({"error": "Доступ к контактам уже разрешён"}), 409

        # Если ранее кандидат отказал, разрешаем отправить запрос повторно
        existing_request.status = "pending"
        existing_request.updated_at = datetime.utcnow()
        contact_request = existing_request

    else:
        contact_request = ContactAccessRequest(
            resume_id=resume.res_id,
            employer_id=user.user_id,
            candidate_id=resume.user_id,
            status="pending"
        )
        db_session.add(contact_request)

    db_session.flush()

    notification = Notification(
        user_id=resume.user_id,
        title="Запрос контактных данных",
        message="Работодатель хочет получить доступ к вашему email. Рассмотрите запрос.",
        notification_type="contact_request",
        is_read=False
    )

    db_session.add(notification)
    db_session.commit()

    return jsonify({
        "message": "Запрос на получение контактов отправлен",
        "request_id": contact_request.request_id,
        "status": contact_request.status
    }), 201

@resumes_bp.route("/contact-requests", methods=["GET"])
@token_required
def get_contact_requests():
    user = g.current_user

    if user.role != "candidate":
        return jsonify({"error": "Только для соискателей"}), 403

    requests_list = (
        db_session.query(ContactAccessRequest)
        .filter_by(candidate_id=user.user_id)
        .order_by(ContactAccessRequest.created_at.desc())
        .all()
    )

    result = []

    for item in requests_list:
        employer = item.employer

        result.append({
            "request_id": item.request_id,
            "resume_id": item.resume_id,
            "resume_title": item.resume.res_title,
            "employer_name": (
                f"{employer.first_name} {employer.last_name}"
            ),
            "company_name": (
                employer.company.comp_name
                if employer.company else None
            ),
            "status": item.status,
            "created_at": item.created_at.isoformat()
        })

    return jsonify({"requests": result}), 200

@resumes_bp.route(
    "/contact-requests/<int:request_id>",
    methods=["PATCH"]
)
@token_required
def respond_to_contact_request(request_id):
    user = g.current_user

    if user.role != "candidate":
        return jsonify({"error": "Только для соискателей"}), 403

    data = request.get_json() or {}
    action = data.get("status")

    if action not in ["approved", "rejected"]:
        return jsonify({
            "error": "Укажите status: approved или rejected"
        }), 400

    contact_request = db_session.query(ContactAccessRequest).filter_by(
        request_id=request_id,
        candidate_id=user.user_id
    ).first()

    if not contact_request:
        return jsonify({"error": "Запрос не найден"}), 404

    if contact_request.status != "pending":
        return jsonify({
            "error": "На этот запрос уже был дан ответ"
        }), 409

    contact_request.status = action
    contact_request.updated_at = datetime.utcnow()

    # Уведомляем работодателя о решении кандидата
    notification = Notification(
        user_id=contact_request.employer_id,
        title="Ответ на запрос контактных данных",
        message=(
            "Кандидат разрешил просмотр email."
            if action == "approved"
            else "Кандидат отклонил запрос на просмотр email."
        ),
        notification_type="contact_response",
        is_read=False
    )

    db_session.add(notification)
    db_session.commit()

    return jsonify({
        "message": (
            "Доступ к контактам разрешён"
            if action == "approved"
            else "Запрос отклонён"
        ),
        "request_id": contact_request.request_id,
        "status": contact_request.status
    }), 200