
import re
import random
from itertools import groupby
from difflib import SequenceMatcher


# Веса критериев. В сумме — 100%.
WEIGHTS = {
    "skills": 35,
    "specialization": 25,
    "experience": 15,
    "salary": 15,
    "region": 10,
}

ANY_REGION = "Любой регион"


def _get(obj, field, default=None):
    """Получает значение как из SQLAlchemy-модели, так и из словаря."""
    if isinstance(obj, dict):
        return obj.get(field, default)
    return getattr(obj, field, default)


def _normalize(value):
    """Приводит строку к единому формату."""
    if value is None:
        return ""

    value = str(value).strip().lower()
    value = value.replace("ё", "е")
    value = re.sub(r"[^\w\s+#.-]", " ", value)
    value = re.sub(r"\s+", " ", value)

    return value.strip()


def _split_skills(value):
    """Разбивает строку навыков на отдельные элементы."""
    if not value:
        return set()

    parts = re.split(r"[,;\n\r]+", str(value))

    return {
        _normalize(part)
        for part in parts
        if _normalize(part)
    }


def _compare_skills(resume_skills, vacancy_skills):
    """
    Сравнивает навыки.
    За основу берём долю требований вакансии,
    которые присутствуют в резюме.
    """
    candidate_skills = _split_skills(resume_skills)
    required_skills = _split_skills(vacancy_skills)

    if not candidate_skills or not required_skills:
        return None, [], []

    matched = []
    missing = []

    for required in required_skills:
        found = any(
            required == candidate
            or (
                len(required) >= 4
                and len(candidate) >= 4
                and (
                    required in candidate
                    or candidate in required
                )
            )
            for candidate in candidate_skills
        )

        if found:
            matched.append(required)
        else:
            missing.append(required)

    score = len(matched) / len(required_skills) * 100

    return round(score, 2), matched, missing


def _compare_specialization(candidate_area, vacancy_area):
    """Сравнивает профессиональную область и специализацию вакансии."""
    candidate = _normalize(candidate_area)
    vacancy = _normalize(vacancy_area)

    if not candidate or not vacancy:
        return None

    if candidate == vacancy:
        return 100

    if candidate in vacancy or vacancy in candidate:
        return 90

    similarity = SequenceMatcher(None, candidate, vacancy).ratio()

    return round(similarity * 100, 2)


def _experience_to_years(value):
    """
    Примерно переводит текстовый уровень опыта в количество лет.
    """
    text = _normalize(value)

    if not text:
        return None

    if "без опыта" in text or "не требуется" in text:
        return 0

    if "более 6" in text or "от 6" in text or "6+" in text:
        return 6

    if "более 3" in text or "от 3" in text:
        if "до 6" in text or "6 лет" in text:
            return 3

    if "до 1" in text:
        return 0

    numbers = [
        int(number)
        for number in re.findall(r"\d+", text)
    ]

    if len(numbers) >= 2:
        return numbers[0]

    if len(numbers) == 1:
        return numbers[0]

    return None


def _compare_experience(candidate_level, required_level):
    """Оценивает, достаточно ли опыта кандидата."""
    candidate_years = _experience_to_years(candidate_level)
    required_years = _experience_to_years(required_level)

    if candidate_years is None or required_years is None:
        return None

    if required_years <= 0:
        return 100

    if candidate_years >= required_years:
        return 100

    return round(candidate_years / required_years * 100, 2)


def _compare_salary(expected_salary, vacancy_salary):
    """
    Сравнивает зарплатные ожидания кандидата
    с зарплатой, указанной в вакансии.
    """
    try:
        expected = float(expected_salary)
        offered = float(vacancy_salary)
    except (TypeError, ValueError):
        return None

    if expected <= 0 or offered <= 0:
        return None

    if offered >= expected:
        return 100

    return round(offered / expected * 100, 2)


def _compare_region(preferred_region, vacancy_region):
    """Сравнивает желаемый регион кандидата и регион вакансии."""
    candidate_region = _normalize(preferred_region)
    vacancy_region = _normalize(vacancy_region)

    if not candidate_region or not vacancy_region:
        return None

    if candidate_region == _normalize(ANY_REGION):
        return 100

    if candidate_region == vacancy_region:
        return 100

    return 0


def calculate_match(resume, vacancy):
    """
    Универсальная оценка совместимости резюме и вакансии.

    Возвращает:
    {
        "score": 85,
        "details": {...},
        "matched_skills": [...],
        "missing_skills": [...]
    }
    """

    skills_score, matched_skills, missing_skills = _compare_skills(
        _get(resume, "skills"),
        _get(vacancy, "skills_required"),
    )

    scores = {
        "skills": skills_score,
        "specialization": _compare_specialization(
            _get(resume, "professional_area"),
            _get(vacancy, "specialization"),
        ),
        "experience": _compare_experience(
            _get(resume, "experience_level"),
            _get(vacancy, "experience_required"),
        ),
        "salary": _compare_salary(
            _get(resume, "salary_expectation"),
            _get(vacancy, "salary"),
        ),
        "region": _compare_region(
            _get(resume, "preferred_region"),
            _get(vacancy, "vac_region"),
        ),
    }

    # Исключаем критерии, по которым нет данных.
    available = {
        key: score
        for key, score in scores.items()
        if score is not None
    }

    if not available:
        total_score = 0
    else:
        available_weight = sum(
            WEIGHTS[key]
            for key in available
        )

        total_score = sum(
            score * WEIGHTS[key]
            for key, score in available.items()
        ) / available_weight

    details = {}

    for key, score in scores.items():
        details[key] = {
            "score": score,
            "weight": WEIGHTS[key],
            "available": score is not None,
        }

    return {
        "score": round(total_score, 2),
        "details": details,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
    }


def _sort_and_shuffle_ties(results, entity_key):
    """
    Сначала сортирует результаты по проценту совпадения.
    Затем случайно перемешивает элементы с одинаковым процентом.

    При каждом новом вызове порядок внутри равных групп
    может быть другим.
    """
    results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    shuffled_results = []

    for score, group in groupby(
        results,
        key=lambda item: item["score"],
    ):
        group_items = list(group)
        random.shuffle(group_items)
        shuffled_results.extend(group_items)

    return shuffled_results


def rank_vacancies_for_resume(resume, vacancies):
    """Сортирует вакансии по совместимости с резюме."""
    results = []

    for vacancy in vacancies:
        match = calculate_match(resume, vacancy)

        results.append({
            "vacancy": vacancy,
            **match,
        })

    return _sort_and_shuffle_ties(results, "vacancy")


def rank_resumes_for_vacancy(vacancy, resumes):
    """Сортирует резюме по совместимости с вакансией."""
    results = []

    for resume in resumes:
        match = calculate_match(resume, vacancy)

        results.append({
            "resume": resume,
            **match,
        })

    return _sort_and_shuffle_ties(results, "resume")
