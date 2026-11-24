from functools import wraps

from flask import g, jsonify

from db import db_session
from db.models import Company, Vacancy


def role_required(role):
    def decorator(view):
        @wraps(view)
        def wrapper(*args, **kwargs):
            if g.current_user.role != role:
                message = (
                    "Доступно только соискателям"
                    if role == "candidate"
                    else "Доступно только работодателям"
                )
                return jsonify({"error": message}), 403
            return view(*args, **kwargs)

        return wrapper

    return decorator


def current_company():
    return db_session.query(Company).filter_by(user_id=g.current_user.user_id).first()


def own_vacancy(vac_id):
    company = current_company()
    if not company:
        return None, None
    vacancy = db_session.query(Vacancy).filter_by(vac_id=vac_id, comp_id=company.comp_id).first()
    return company, vacancy


def error(message, status):
    return jsonify({"error": message}), status
