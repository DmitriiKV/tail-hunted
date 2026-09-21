Отлично, что разобрался! Давай всё систематизирую.

## 📁 Полная архитектура с пояснениями

### `server/` — бэкенд на Flask

```
server/
├── app.py                 # Точка входа. create_app(), регистрация роутов, CORS
├── config.py              # Настройки: DATABASE_URL, SECRET_KEY, JWT_EXPIRES
├── requirements.txt       # Зависимости Python (pip install -r)
├── main.py                # Скрипт инициализации БД (create_all)
│
├── db/                    # Всё, что связано с базой данных
│   ├── __init__.py        # Экспорт engine, Base, db_session для удобных импортов
│   ├── database.py        # Создание engine, SessionLocal, Base
│   └── models/            # SQLAlchemy-модели (описание таблиц)
│       ├── __init__.py    # Импорт всех моделей — чтобы Base "видел" их
│       ├── user.py        # Таблица users
│       ├── company.py     # Таблица companies
│       ├── resume.py      # Таблица resumes
│       ├── vacancy.py     # Таблица vacancies
│       └── application.py # Таблица applications
│
├── routes/                # HTTP-эндпоинты (Blueprint'ы Flask)
│   ├── __init__.py        # Регистрация всех blueprint'ов в одном месте
│   ├── auth.py            # /api/auth/register, /api/auth/login
│   ├── resumes.py         # CRUD резюме + отклики от кандидата
│   ├── vacancies.py       # CRUD вакансий + отклики от работодателя
│   └── applications.py    # Работа с откликами (создать, посмотреть статус)
│
├── services/              # Бизнес-логика (отделена от HTTP)
│   ├── __init__.py
│   ├── auth_service.py             # Хэширование пароля, выдача JWT, проверка
│   └── recommendation_service.py   # Лента рекомендаций (совпадение skills)
│
├── schemas/               # Pydantic-схемы (валидация входящих данных)
│   └── __init__.py
│
└── uploads/               # Файлы, загруженные пользователями (позже)
```

**Зачем такое разделение:**
*   `routes/` — **тонкий слой**, только принимает запрос и возвращает ответ. Никакой логики.
*   `services/` — **вся логика**: проверить пароль, посчитать рекомендации, создать отклик.
*   `db/models/` — **только описание структуры БД**. Никаких запросов тут.
*   `schemas/` — валидация входа/выхода. Пока можно не заполнять.

### `client/` — фронтенд на React

```
client/
├── public/                # Статика (favicon, index.html-шаблон)
├── src/
│   ├── main.jsx           # Точка входа React (рендерит <App />)
│   ├── App.jsx            # Корневой компонент + роутинг
│   │
│   ├── components/        # Переиспользуемые UI-компоненты (без логики API)
│   │   ├── common/        # Button, Input, Modal, Card
│   │   ├── forms/         # LoginForm, RegisterForm, ResumeForm
│   │   └── layout/        # Header, Sidebar, Footer
│   │
│   ├── pages/             # Страницы приложения (то, что видно по URL)
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── RoleSelectPage.jsx
│   │   ├── ResumePage.jsx
│   │   ├── VacancyPage.jsx
│   │   └── FeedPage.jsx
│   │
│   ├── hooks/             # Кастомные хуки (переиспользуемая логика React)
│   │   ├── useAuth.js     # Текущий пользователь, login, logout
│   │   └── useFetch.js    # Обёртка над fetch с loading/error
│   │
│   ├── services/          # Работа с API (единственное место, где есть fetch)
│   │   ├── api.js         # Базовый axios/fetch + baseURL
│   │   ├── authService.js
│   │   └── vacancyService.js
│   │
│   ├── store/             # Глобальное состояние (Context или Redux)
│   │   └── authContext.jsx
│   │
│   └── utils/             # Вспомогательные функции (форматирование дат, валидация)
│       └── formatDate.js
│
├── index.html
├── package.json
└── vite.config.js
```

**Ключевое правило:** компонент **никогда** не делает `fetch` напрямую. Он вызывает хук или сервис. Так потом легко менять API в одном месте.

---

## 🐘 Настройка PostgreSQL

### Шаг 1. Установи PostgreSQL

**Вариант А — через Docker (проще, рекомендую):**
```bash
docker run --name job-db \
  -e POSTGRES_USER=jobuser \
  -e POSTGRES_PASSWORD=jobpass \
  -e POSTGRES_DB=jobapp \
  -p 5432:5432 \
  -d postgres:16
```

**Вариант Б — локально:** скачай с [postgresql.org](https://www.postgresql.org/download/) и запомни пароль от пользователя `postgres`.

Проверь, что работает:
```bash
psql -h localhost -U jobuser -d jobapp
# или
docker exec -it job-db psql -U jobuser -d jobapp
```

### Шаг 2. Установи Python-зависимости

```bash
cd server
pip install sqlalchemy psycopg2-binary flask flask-cors python-dotenv
```

Создай `requirements.txt`:
```
sqlalchemy
psycopg2-binary
flask
flask-cors
python-dotenv
```

### Шаг 3. Настрой `config.py`

```python
import os

class Config:
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://jobuser:jobpass@localhost:5432/jobapp"
    )
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
```

### Шаг 4. Проверь `db/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from config import Config

engine = create_engine(Config.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db_session = scoped_session(SessionLocal)
Base = declarative_base()
```

### Шаг 5. `db/__init__.py`

```python
from .database import engine, Base, db_session

__all__ = ["engine", "Base", "db_session"]
```

### Шаг 6. `db/models/__init__.py`

**Важно:** здесь нужно импортировать **все** модели, чтобы SQLAlchemy знала о них при создании таблиц.

```python
from .user import User
from .company import Company
from .resume import Resume
from .vacancy import Vacancy
from .application import Application

__all__ = ["User", "Company", "Resume", "Vacancy", "Application"]
```

### Шаг 7. `main.py`

```python
from db import engine, Base
from db.models import User, Company, Resume, Vacancy, Application  # noqa

def init_db():
    # Base.metadata.drop_all(engine)   # раскомментируй, чтобы стереть всё
    Base.metadata.create_all(engine)
    print("✅ Tables are successfully created")

if __name__ == "__main__":
    init_db()
```

### Шаг 8. Запусти

```bash
cd server
python main.py
```

Должно появиться `✅ Tables are successfully created`.

### Шаг 9. Проверь в БД

```bash
docker exec -it job-db psql -U jobuser -d jobapp -c "\dt"
```

Увидишь список таблиц: `users`, `companies`, `resumes`, `vacancies`, `applications`.

---

## ⚠️ Частые ошибки

| Ошибка | Причина | Решение |
|---|---|---|
| `ModuleNotFoundError: No module named 'db'` | Запускаешь `main.py` не из папки `server/` | `cd server` перед запуском |
| `could not connect to server` | Postgres не запущен | Проверь `docker ps` или службу |
| `password authentication failed` | Неверный логин/пароль | Сверь с `DATABASE_URL` |
| `relation "users" already exists` | Таблицы уже созданы | Это нормально, `create_all` идемпотентен |
| Таблицы не создаются | Забыл импорт модели в `models/__init__.py` | Импортируй все 5 моделей |

---

## 🎯 Что дальше

1. Запусти `main.py` — убедись, что таблицы создались.
2. Открой pgAdmin или `psql`, посмотри структуру — это твой фундамент.
3. Следующий шаг — **модели SQLAlchemy**. Напиши их по структуре таблиц из предыдущего сообщения.
4. Потом — **auth-роут** (`/api/auth/register`) и тест через Postman.
5. Только после этого — React-страницы.

Если на каком-то шаге поймаешь ошибку — присылай текст, разберём.