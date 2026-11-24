from flask import jsonify, request


def paginate(query, orderings, default_sort="newest", serialize=None):
    page = max(request.args.get("page", 1, type=int) or 1, 1)
    per_page = min(max(request.args.get("per_page", 10, type=int) or 10, 1), 50)
    sort = request.args.get("sort", default_sort)

    query = query.order_by(*orderings.get(sort, orderings[default_sort]))
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "items": [serialize(item) for item in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    })
