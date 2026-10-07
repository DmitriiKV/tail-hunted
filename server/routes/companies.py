from flask import Blueprint, request, jsonify, g
from db import db_session
from db.models import Company
from utils.auth_middleware import token_required

companies_bp = Blueprint("companies", __name__, url_prefix="/api/companies")


def company_to_dict(c):
    return {
        "comp_id": c.comp_id,
        "comp_name": c.comp_name,
        "comp_region": c.comp_region,
        "address": c.address,
        "size": c.size,
        "comp_description": c.comp_description,
        "comp_phone": c.comp_phone,
        "comp_email": c.comp_email,
    }


@companies_bp.route("", methods=["POST"])
@token_required
def create_company():
    user = g.current_user
    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    existing = db_session.query(Company).filter_by(user_id=user.user_id).first()
    if existing:
        return jsonify({"error": "У вас уже есть компания"}), 400

    data = request.get_json() or {}
    if not data.get("comp_name"):
        return jsonify({"error": "Поле 'comp_name' обязательно"}), 400

    company = Company(
        user_id=user.user_id,
        comp_name=data["comp_name"],
        comp_region=data.get("comp_region"),
        address=data.get("address"),
        size=data.get("size"),
        comp_description=data.get("comp_description"),
        comp_phone=data.get("comp_phone"),
        comp_email=data.get("comp_email"),
    )
    db_session.add(company)
    db_session.commit()
    return jsonify(company_to_dict(company)), 201


@companies_bp.route("/my", methods=["GET"])
@token_required
def get_my_company():
    user = g.current_user
    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    company = db_session.query(Company).filter_by(user_id=user.user_id).first()
    if not company:
        return jsonify({"error": "Компания не создана"}), 404

    return jsonify(company_to_dict(company))

@companies_bp.route("/my", methods=["PATCH"])
@token_required
def update_my_company():
    user = g.current_user
    if user.role != "employer":
        return jsonify({"error": "Только для работодателей"}), 403

    company = db_session.query(Company).filter_by(user_id=user.user_id).first()
    if not company:
        return jsonify({"error": "Компания не создана"}), 404

    data = request.get_json() or {}
    for field in ["comp_name", "comp_region", "address", "size",
                  "comp_description", "comp_phone", "comp_email"]:
        if field in data:
            setattr(company, field, data[field])

    db_session.commit()
    return jsonify(company_to_dict(company))