import json

def _preferred_schedule_to_list(value):
    if not value:
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed if item]
    except (TypeError, ValueError):
        pass
    return [str(value)]

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
        "preferred_schedule": _preferred_schedule_to_list(r.preferred_schedule),
        "res_created_at": r.res_created_at.isoformat() if r.res_created_at else None,
    }


def vacancy_to_dict(v, with_company_name=False):
    data = {
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
    if with_company_name:
        data["comp_name"] = v.company.comp_name if v.company else None
    return data
