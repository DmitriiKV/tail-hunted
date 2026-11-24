"""
Создаёт демонстрационные данные Tail-Hunted:
10 работодателей, 10 компаний, 10 кандидатов, 10 вакансий и 10 резюме.

Запуск из папки server:
    python seed.py

Скрипт безопасен для повторного запуска: тестовые аккаунты ищутся по email
с префиксами demo.employer и demo.candidate. Существующие записи не удаляются.
"""

from datetime import date
from sqlalchemy.exc import IntegrityError

from db import db_session, User, Company, Vacancy, Resume
from services.auth_service import hash_password


TEST_PASSWORD = "Test12345!"

REGIONS = [
    "Москва",
    "Санкт-Петербург",
    "Московская область",
    "Республика Татарстан",
    "Свердловская область",
    "Новосибирская область",
    "Краснодарский край",
    "Нижегородская область",
    "Самарская область",
    "Ленинградская область",
]

COMPANIES = [
    ("СеверСофт", "Разработка корпоративных веб-систем и цифровых сервисов для бизнеса.", "51-200"),
    ("Пиксельная", "Дизайн-студия, создающая интерфейсы цифровых продуктов и мобильных приложений.", "11-50"),
    ("ДанныеПлюс", "Команда аналитиков и инженеров данных для ритейла и финансового сектора.", "51-200"),
    ("Маяк Маркетинг", "Агентство интернет-маркетинга и продвижения брендов.", "11-50"),
    ("ОблакоЛаб", "Разрабатываем облачные платформы и инструменты автоматизации.", "51-200"),
    ("ФинТех Платформа", "Финансовые технологии, платёжные решения и аналитические продукты.", "201-500"),
    ("Умный Склад", "ИТ-решения для логистики, складов и управления поставками.", "51-200"),
    ("Студия Формы", "Продуктовая дизайн-команда: исследования, UX/UI и визуальные системы.", "1-10"),
    ("ЭкоДом", "Онлайн-сервис товаров для дома и экологичного образа жизни.", "11-50"),
    ("Кодовая Практика", "Образовательная платформа и разработка внутренних цифровых продуктов.", "51-200"),
]

EMPLOYERS = [
    ("Иван", "Петров", "Сергеевич"),
    ("Мария", "Соколова", "Андреевна"),
    ("Алексей", "Морозов", "Игоревич"),
    ("Екатерина", "Волкова", "Дмитриевна"),
    ("Дмитрий", "Кузнецов", "Олегович"),
    ("Анна", "Попова", "Владимировна"),
    ("Сергей", "Лебедев", "Павлович"),
    ("Ольга", "Новикова", "Романовна"),
    ("Михаил", "Фёдоров", "Алексеевич"),
    ("Наталья", "Беляева", "Ильинична"),
]

VACANCIES = [
    ("Python-разработчик", "Backend-разработка", "full", "5/2", 180000, "От 1 до 3 лет",
     "Python, Django, PostgreSQL, REST API", "Разработка и поддержка backend-сервисов, проектирование API, оптимизация запросов и участие в code review."),
    ("UX/UI-дизайнер", "Дизайн", "full", "Гибкий", 145000, "От 1 до 3 лет",
     "Figma, UX, UI, прототипирование, дизайн-системы", "Проектирование пользовательских сценариев, создание прототипов и развитие дизайн-системы продукта."),
    ("Системный аналитик", "Аналитика", "full", "5/2", 170000, "Более 3 лет",
     "SQL, UML, BPMN, REST API, документация", "Сбор требований, описание бизнес-процессов, подготовка технических заданий и взаимодействие с разработчиками."),
    ("Маркетолог", "Маркетинг", "full", "5/2", 120000, "От 1 до 3 лет",
     "Яндекс Директ, аналитика, SEO, контент", "Планирование рекламных кампаний, анализ эффективности каналов и подготовка предложений по росту."),
    ("DevOps-инженер", "Инфраструктура", "full", "Удалённо", 220000, "Более 3 лет",
     "Docker, Kubernetes, Linux, CI/CD, облака", "Поддержка инфраструктуры, автоматизация поставки приложений, мониторинг и повышение надёжности сервисов."),
    ("Frontend-разработчик", "Frontend-разработка", "full", "5/2", 160000, "От 1 до 3 лет",
     "JavaScript, React, TypeScript, HTML, CSS", "Разработка интерфейсов веб-приложений, интеграция с API и улучшение производительности."),
    ("Специалист по логистике", "Логистика", "full", "2/2", 95000, "От 1 до 3 лет",
     "Excel, логистика, 1С, документооборот", "Координация поставок, контроль сроков, работа с перевозчиками и складскими подразделениями."),
    ("Графический дизайнер", "Дизайн", "project", "Гибкий", 100000, "Без опыта",
     "Figma, Photoshop, Illustrator, композиция", "Подготовка графических материалов для цифровых каналов и рекламных кампаний под руководством арт-директора."),
    ("Менеджер интернет-магазина", "Электронная коммерция", "full", "5/2", 110000, "От 1 до 3 лет",
     "Excel, CRM, аналитика продаж, маркетплейсы", "Управление ассортиментом и карточками товаров, анализ продаж и координация операционных задач."),
    ("QA-инженер", "Тестирование", "full", "5/2", 135000, "От 1 до 3 лет",
     "Тестирование, Postman, SQL, баг-трекинг", "Функциональное и интеграционное тестирование веб-продукта, оформление дефектов и проверка исправлений."),
]

CANDIDATES = [
    ("Артём", "Смирнов", "Ильич"),
    ("София", "Козлова", "Максимовна"),
    ("Максим", "Орлов", "Денисович"),
    ("Виктория", "Андреева", "Петровна"),
    ("Кирилл", "Зайцев", "Михайлович"),
    ("Алиса", "Григорьева", "Евгеньевна"),
    ("Роман", "Павлов", "Артёмович"),
    ("Полина", "Семёнова", "Игоревна"),
    ("Егор", "Васильев", "Николаевич"),
    ("Дарья", "Михайлова", "Сергеевна"),
]

RESUMES = [
    ("Python-разработчик", "Разработка", 170000, "Backend-разработка",
     "Python, Django, FastAPI, PostgreSQL, Redis, Docker",
     "Высшее образование, прикладная информатика.",
     "3 года разрабатывал backend веб-сервисов. Проектировал REST API, оптимизировал SQL-запросы, писал тесты и участвовал в code review.",
     "От 1 до 3 лет"),
    ("UX/UI-дизайнер", "Дизайн", 135000, "Дизайн интерфейсов",
     "Figma, UX research, UI, прототипирование, дизайн-системы",
     "Высшее образование, графический дизайн.",
     "Создавала интерфейсы личных кабинетов и мобильных приложений. Проводила базовые исследования и собирала интерактивные прототипы.",
     "От 1 до 3 лет"),
    ("Системный аналитик", "Аналитика", 165000, "Системный анализ",
     "SQL, BPMN, UML, REST API, Jira, Confluence",
     "Высшее образование, бизнес-информатика.",
     "Описывал требования, моделировал процессы, готовил спецификации API и сопровождал задачи от постановки до приёмки.",
     "Более 3 лет"),
    ("Интернет-маркетолог", "Маркетинг", 115000, "Маркетинг",
     "SEO, Яндекс Директ, веб-аналитика, контент, Excel",
     "Высшее образование, маркетинг.",
     "Вёл рекламные кампании, анализировал конверсию и готовил отчёты по эффективности каналов привлечения.",
     "От 1 до 3 лет"),
    ("DevOps-инженер", "Инфраструктура", 210000, "DevOps",
     "Linux, Docker, Kubernetes, GitLab CI, Terraform",
     "Высшее техническое образование.",
     "Поддерживал Linux-серверы, настраивал CI/CD, контейнеризацию и мониторинг тестовых и production-сред.",
     "Более 3 лет"),
    ("Frontend-разработчик", "Разработка", 155000, "Frontend-разработка",
     "JavaScript, React, TypeScript, HTML, CSS, Git",
     "Высшее образование, программная инженерия.",
     "Разрабатывал SPA на React, интегрировал REST API, создавал адаптивные интерфейсы и поддерживал существующие компоненты.",
     "От 1 до 3 лет"),
    ("Специалист по логистике", "Логистика", 90000, "Логистика",
     "Excel, 1С, документооборот, планирование поставок",
     "Среднее профессиональное образование, логистика.",
     "Координировал отгрузки, взаимодействовал с перевозчиками, контролировал документы и сроки доставки.",
     "От 1 до 3 лет"),
    ("Младший графический дизайнер", "Дизайн", 70000, "Графический дизайн",
     "Figma, Photoshop, Illustrator, типографика",
     "Профильное образование, графический дизайн.",
     "Учебные и небольшие коммерческие проекты: баннеры, презентации, оформление публикаций и простые макеты.",
     "Без опыта"),
    ("Менеджер электронной коммерции", "Продажи", 105000, "Электронная коммерция",
     "CRM, Excel, маркетплейсы, аналитика продаж",
     "Высшее образование, менеджмент.",
     "Работал с ассортиментом интернет-магазина, обновлял карточки товаров, анализировал продажи и готовил отчёты.",
     "От 1 до 3 лет"),
    ("QA-инженер", "Тестирование", 125000, "Тестирование ПО",
     "Postman, SQL, функциональное тестирование, Jira",
     "Высшее образование, информационные системы.",
     "Тестировал веб-приложения вручную, составлял чек-листы и тест-кейсы, заводил дефекты и проверял исправления.",
     "От 1 до 3 лет"),
]


def main():
    created = {"employers": 0, "companies": 0, "candidates": 0, "vacancies": 0, "resumes": 0}

    try:
        # Сначала создаём работодателей и компании.
        employer_users = []
        for i, ((first, last, middle), company_data) in enumerate(zip(EMPLOYERS, COMPANIES), start=1):
            email = f"demo.employer{i:02d}@tail-hunted.test"
            user = db_session.query(User).filter_by(user_email=email).first()
            if user is None:
                user = User(
                    user_email=email,
                    password=hash_password(TEST_PASSWORD),
                    first_name=first,
                    last_name=last,
                    middle_name=middle,
                    role="employer",
                )
                db_session.add(user)
                db_session.flush()
                created["employers"] += 1

            employer_users.append(user)

            company = db_session.query(Company).filter_by(user_id=user.user_id).first()
            if company is None:
                name, description, size = company_data
                company = Company(
                    user_id=user.user_id,
                    comp_name=name,
                    comp_region=REGIONS[(i - 1) % len(REGIONS)],
                    address=f"Деловой район, офис {100 + i}",
                    size=size,
                    comp_description=description,
                    comp_phone=f"+7-900-000-{i:04d}",
                    comp_email=f"hello{i:02d}@tail-hunted.test",
                )
                db_session.add(company)
                db_session.flush()
                created["companies"] += 1

            vacancy = db_session.query(Vacancy).filter_by(
                comp_id=company.comp_id,
                vac_title=VACANCIES[i - 1][0],
            ).first()
            if vacancy is None:
                title, specialization, employment, schedule, salary, experience, skills, description = VACANCIES[i - 1]
                db_session.add(Vacancy(
                    comp_id=company.comp_id,
                    vac_title=title,
                    specialization=specialization,
                    hiring_plan=2 if i % 3 == 0 else 1,
                    employment_type=employment,
                    schedule=schedule,
                    salary=salary,
                    experience_required=experience,
                    skills_required=skills,
                    vac_description=description,
                    vac_region=REGIONS[(i - 1) % len(REGIONS)],
                ))
                created["vacancies"] += 1

        # Затем создаём кандидатов и по одному резюме каждому.
        for i, (first, last, middle) in enumerate(CANDIDATES, start=1):
            email = f"demo.candidate{i:02d}@tail-hunted.test"
            user = db_session.query(User).filter_by(user_email=email).first()
            if user is None:
                user = User(
                    user_email=email,
                    password=hash_password(TEST_PASSWORD),
                    first_name=first,
                    last_name=last,
                    middle_name=middle,
                    role="candidate",
                )
                db_session.add(user)
                db_session.flush()
                created["candidates"] += 1

            existing_resume = db_session.query(Resume).filter_by(user_id=user.user_id).first()
            if existing_resume is None:
                title, area, salary, professional_area, skills, education, experience, level = RESUMES[i - 1]
                db_session.add(Resume(
                    user_id=user.user_id,
                    res_title=title,
                    gender="male" if i % 2 else "female",
                    birth_date=date(1990 + (i % 8), (i % 12) + 1, 10 + (i % 15)),
                    salary_expectation=salary,
                    professional_area=professional_area,
                    education=education,
                    skills=skills,
                    experience=experience,
                    experience_level=level,
                    preferred_region=REGIONS[(i - 1) % len(REGIONS)],
                ))
                created["resumes"] += 1

        db_session.commit()
        print("Готово! Тестовые данные проверены/созданы:")
        for key, value in created.items():
            print(f"  {key}: добавлено {value}")
        print(f"\nТестовый пароль для всех аккаунтов: {TEST_PASSWORD}")
        print("Работодатели: demo.employer01@tail-hunted.test ... demo.employer10@tail-hunted.test")
        print("Кандидаты:    demo.candidate01@tail-hunted.test ... demo.candidate10@tail-hunted.test")
        print("Повторный запуск не должен создавать дубликаты.")

    except Exception:
        db_session.rollback()
        raise
    finally:
        db_session.remove()


if __name__ == "__main__":
    main()
