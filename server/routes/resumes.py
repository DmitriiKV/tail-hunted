from datetime import datetime
import json

from flask import Blueprint, g, jsonify, request

from db import db_session
from db.models import ContactAccessRequest, Resume
from utils.serializers import resume_to_dict
from services.notification_service import create_notification
from services.search_service import apply_search
from utils.access import error, role_required
from utils.auth_middleware import token_required
from utils.paging import paginate

resumes_bp = Blueprint("resumes", __name__, url_prefix="/api/resumes")

EDITABLE_FIELDS = (
    "res_title", "gender", "salary_expectation", "professional_area",
    "education", "skills", "experience", "experience_level", "preferred_region", "preferred_schedule",
)

ORDERINGS = {
    "newest": (Resume.res_created_at.desc(), Resume.res_id.desc()),
    "oldest": (Resume.res_created_at.asc(), Resume.res_id.asc()),
    "salary_asc": (Resume.salary_expectation.asc().nullslast(), Resume.res_created_at.desc()),
    "salary_desc": (Resume.salary_expectation.desc().nullslast(), Resume.res_created_at.desc()),
}


def normalize_preferred_schedule(value):
    if value is None:
        return None
    if not isinstance(value, list):
        return None
    allowed = {"5/2", "6/1", "2/2", "3/3", "1/3", "Гибкий график", "Свободный график", "Не имеет значения"}
    cleaned = []
    for item in value:
        if item in allowed and item not in cleaned:
            cleaned.append(item)
    if "Не имеет значения" in cleaned:
        return json.dumps(["Не имеет значения"], ensure_ascii=False)
    return json.dumps(cleaned, ensure_ascii=False)


def parse_birth_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


@resumes_bp.route("", methods=["POST"])
@token_required
@role_required("candidate")
def create_resume():
    data = request.get_json() or {}
    if not data.get("res_title"):
        return error("Поле 'res_title' обязательно", 400)

    birth_date = None
    if data.get("birth_date"):
        try:
            birth_date = parse_birth_date(data["birth_date"])
        except ValueError:
            return error("Дата должна быть в формате YYYY-MM-DD", 400)

    resume = Resume(
        user_id=g.current_user.user_id,
        birth_date=birth_date,
        **{field: data.get(field) for field in EDITABLE_FIELDS if field not in ("preferred_region", "preferred_schedule")},
        preferred_region=data.get("preferred_region") or "Любой регион",
        preferred_schedule=normalize_preferred_schedule(data.get("preferred_schedule")),
    )
    db_session.add(resume)
    db_session.commit()
    return jsonify(resume_to_dict(resume)), 201


@resumes_bp.route("/my", methods=["GET"])
@token_required
@role_required("candidate")
def get_my_resumes():
    resumes = db_session.query(Resume).filter_by(user_id=g.current_user.user_id).all()
    return jsonify([resume_to_dict(r) for r in resumes])


@resumes_bp.route("/<int:res_id>", methods=["PATCH"])
@token_required
@role_required("candidate")
def update_resume(res_id):
    resume = db_session.query(Resume).filter_by(res_id=res_id, user_id=g.current_user.user_id).first()
    if not resume:
        return error("Резюме не найдено", 404)

    data = request.get_json() or {}
    if data.get("birth_date"):
        try:
            resume.birth_date = parse_birth_date(data["birth_date"])
        except ValueError:
            return error("Дата должна быть в формате YYYY-MM-DD", 400)

    for field in EDITABLE_FIELDS:
        if field in data:
            if field == "preferred_schedule":
                resume.preferred_schedule = normalize_preferred_schedule(data[field])
            else:
                setattr(resume, field, data[field])

    db_session.commit()
    return jsonify(resume_to_dict(resume))


@resumes_bp.route("", methods=["GET"])
@token_required
@role_required("employer")
def list_resumes():
    args = request.args
    query = apply_search(
        query=db_session.query(Resume),
        model=Resume,
        search_fields=[
            "res_title", "professional_area", "education", "skills",
            "experience", "experience_level", "preferred_region", "preferred_schedule",
        ],
        filters={
            "q": args.get("q", ""),
            "max_salary": args.get("max_salary", type=int),
            "text": {
                "professional_area": args.get("specialization", ""),
                "skills": args.get("skills", ""),
                "education": args.get("education", ""),
                "experience": args.get("experience", ""),
                "preferred_region": args.get("region", ""),
                "preferred_schedule": args.get("schedule", ""),
            },
        },
    )
    return paginate(query, ORDERINGS, serialize=resume_to_dict)


@resumes_bp.route("/<int:res_id>", methods=["GET"])
@token_required
@role_required("employer")
def get_resume(res_id):
    resume = db_session.query(Resume).filter_by(res_id=res_id).first()
    if not resume:
        return error("Резюме не найдено", 404)

    approved = db_session.query(ContactAccessRequest).filter_by(
        resume_id=resume.res_id, employer_id=g.current_user.user_id, status="approved"
    ).first()

    result = resume_to_dict(resume)
    result["contact_email"] = resume.user.user_email if approved else None
    return jsonify(result)


@resumes_bp.route("/<int:res_id>/contact-request", methods=["POST"])
@token_required
@role_required("employer")
def request_resume_contacts(res_id):
    user = g.current_user
    resume = db_session.query(Resume).filter_by(res_id=res_id).first()
    if not resume:
        return error("Резюме не найдено", 404)

    contact_request = db_session.query(ContactAccessRequest).filter_by(
        resume_id=resume.res_id, employer_id=user.user_id
    ).first()

    if contact_request:
        if contact_request.status == "pending":
            return error("Запрос уже отправлен", 409)
        if contact_request.status == "approved":
            return error("Доступ к контактам уже разрешён", 409)
        contact_request.status = "pending"
        contact_request.updated_at = datetime.utcnow()
    else:
        contact_request = ContactAccessRequest(
            resume_id=resume.res_id,
            employer_id=user.user_id,
            candidate_id=resume.user_id,
            status="pending",
        )
        db_session.add(contact_request)

    db_session.flush()
    company_name = user.company.comp_name if user.company else "Работодатель"
    create_notification(
        user_id=resume.user_id,
        title="Запрос контактных данных",
        message=f"{company_name} просит доступ к вашему email",
        notification_type="contact_request",
    )
    db_session.commit()

    return jsonify({
        "message": "Запрос отправлен кандидату",
        "request_id": contact_request.request_id,
        "status": contact_request.status,
    }), 201


@resumes_bp.route("/contact-requests", methods=["GET"])
@token_required
@role_required("candidate")
def get_contact_requests():
    items = (
        db_session.query(ContactAccessRequest)
        .filter_by(candidate_id=g.current_user.user_id)
        .order_by(ContactAccessRequest.created_at.desc())
        .all()
    )
    return jsonify({"requests": [
        {
            "request_id": item.request_id,
            "resume_id": item.resume_id,
            "resume_title": item.resume.res_title,
            "employer_name": f"{item.employer.first_name} {item.employer.last_name}",
            "company_name": item.employer.company.comp_name if item.employer.company else None,
            "status": item.status,
            "created_at": item.created_at.isoformat(),
        }
        for item in items
    ]})


@resumes_bp.route("/contact-requests/<int:request_id>", methods=["PATCH"])
@token_required
@role_required("candidate")
def respond_to_contact_request(request_id):
    decision = (request.get_json() or {}).get("status")
    if decision not in ("approved", "rejected"):
        return error("Укажите status: approved или rejected", 400)

    contact_request = db_session.query(ContactAccessRequest).filter_by(
        request_id=request_id, candidate_id=g.current_user.user_id
    ).first()
    if not contact_request:
        return error("Запрос не найден", 404)
    if contact_request.status != "pending":
        return error("На этот запрос уже был дан ответ", 409)

    contact_request.status = decision
    contact_request.updated_at = datetime.utcnow()
    approved = decision == "approved"
    create_notification(
        user_id=contact_request.employer_id,
        title="Ответ на запрос контактов",
        message="Кандидат открыл email" if approved else "Кандидат не открыл email",
        notification_type="contact_response",
    )
    db_session.commit()

    return jsonify({
        "message": "Доступ к контактам разрешён" if approved else "Запрос отклонён",
        "request_id": contact_request.request_id,
        "status": contact_request.status,
    })
