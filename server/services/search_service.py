
from sqlalchemy import or_


def apply_search(query, model, search_fields=None, filters=None):
    """
    Универсальный поиск и фильтрация SQLAlchemy.

    search_fields — текстовые поля для общего поиска.
    filters — дополнительные условия фильтрации.
    """

    search_fields = search_fields or []
    filters = filters or {}

    # Общий поиск по нескольким текстовым полям
    search_text = filters.get("q")

    if search_text:
        search_text = search_text.strip()

        if search_text:
            conditions = [
                getattr(model, field).ilike(f"%{search_text}%")
                for field in search_fields
                if hasattr(model, field)
            ]

            if conditions:
                query = query.filter(or_(*conditions))

    # Фильтрация по текстовым полям
    for field in filters.get("text", {}):
        value = filters["text"][field]

        if value and hasattr(model, field):
            query = query.filter(
                getattr(model, field).ilike(f"%{value.strip()}%")
            )

    # Минимальная зарплата
    min_salary = filters.get("min_salary")

    if min_salary is not None and hasattr(model, "salary"):
        query = query.filter(model.salary >= min_salary)

    if min_salary is not None and hasattr(model, "salary_expectation"):
        query = query.filter(model.salary_expectation >= min_salary)

    # Максимальная зарплата
    max_salary = filters.get("max_salary")

    if max_salary is not None and hasattr(model, "salary"):
        query = query.filter(model.salary <= max_salary)

    if max_salary is not None and hasattr(model, "salary_expectation"):
        query = query.filter(model.salary_expectation <= max_salary)

    return query
