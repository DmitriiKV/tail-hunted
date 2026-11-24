--
-- PostgreSQL database dump
--

\restrict QIF21GUdjVvaIZj4ji70yJ1K4gdZkr8Ul2lKOeXVbpkEMWTQdB8ylo2ln5n5zZC

-- Dumped from database version 16.15 (Debian 16.15-1.pgdg13+2)
-- Dumped by pg_dump version 16.15 (Debian 16.15-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO jobuser;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.applications (
    app_id integer NOT NULL,
    res_id integer NOT NULL,
    vac_id integer NOT NULL,
    status character varying(20) NOT NULL,
    app_created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.applications OWNER TO jobuser;

--
-- Name: applications_app_id_seq; Type: SEQUENCE; Schema: public; Owner: jobuser
--

CREATE SEQUENCE public.applications_app_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_app_id_seq OWNER TO jobuser;

--
-- Name: applications_app_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobuser
--

ALTER SEQUENCE public.applications_app_id_seq OWNED BY public.applications.app_id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.companies (
    comp_id integer NOT NULL,
    user_id integer NOT NULL,
    comp_name character varying(150) NOT NULL,
    comp_region character varying(100),
    address character varying(255),
    size character varying(20),
    comp_description character varying(2000),
    comp_phone character varying(30),
    comp_email character varying(120)
);


ALTER TABLE public.companies OWNER TO jobuser;

--
-- Name: companies_comp_id_seq; Type: SEQUENCE; Schema: public; Owner: jobuser
--

CREATE SEQUENCE public.companies_comp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_comp_id_seq OWNER TO jobuser;

--
-- Name: companies_comp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobuser
--

ALTER SEQUENCE public.companies_comp_id_seq OWNED BY public.companies.comp_id;


--
-- Name: contact_access_requests; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.contact_access_requests (
    request_id integer NOT NULL,
    resume_id integer NOT NULL,
    employer_id integer NOT NULL,
    candidate_id integer NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


ALTER TABLE public.contact_access_requests OWNER TO jobuser;

--
-- Name: contact_access_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: jobuser
--

CREATE SEQUENCE public.contact_access_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contact_access_requests_request_id_seq OWNER TO jobuser;

--
-- Name: contact_access_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobuser
--

ALTER SEQUENCE public.contact_access_requests_request_id_seq OWNED BY public.contact_access_requests.request_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer NOT NULL,
    app_id integer,
    title character varying(150) NOT NULL,
    message character varying(500) NOT NULL,
    notification_type character varying(30) NOT NULL,
    is_read boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO jobuser;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: jobuser
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO jobuser;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobuser
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: resumes; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.resumes (
    res_id integer NOT NULL,
    user_id integer NOT NULL,
    res_title character varying(150) NOT NULL,
    gender character varying(10),
    birth_date date,
    salary_expectation integer,
    professional_area character varying(150),
    education character varying(1000),
    skills character varying(1000),
    experience character varying(3000),
    res_created_at timestamp without time zone NOT NULL,
    experience_level character varying(50),
    preferred_region character varying(100) NOT NULL
);


ALTER TABLE public.resumes OWNER TO jobuser;

--
-- Name: resumes_res_id_seq; Type: SEQUENCE; Schema: public; Owner: jobuser
--

CREATE SEQUENCE public.resumes_res_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resumes_res_id_seq OWNER TO jobuser;

--
-- Name: resumes_res_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobuser
--

ALTER SEQUENCE public.resumes_res_id_seq OWNED BY public.resumes.res_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    user_email character varying(120) NOT NULL,
    password character varying(255) NOT NULL,
    last_name character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    middle_name character varying(150) NOT NULL,
    role character varying(20) NOT NULL
);


ALTER TABLE public.users OWNER TO jobuser;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: jobuser
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO jobuser;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobuser
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: vacancies; Type: TABLE; Schema: public; Owner: jobuser
--

CREATE TABLE public.vacancies (
    vac_id integer NOT NULL,
    comp_id integer NOT NULL,
    vac_title character varying(150) NOT NULL,
    specialization character varying(150),
    hiring_plan integer,
    employment_type character varying(20),
    schedule character varying(50),
    salary integer,
    experience_required character varying(50),
    skills_required character varying(1000),
    vac_description character varying(5000),
    vac_region character varying(100),
    vac_created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.vacancies OWNER TO jobuser;

--
-- Name: vacancies_vac_id_seq; Type: SEQUENCE; Schema: public; Owner: jobuser
--

CREATE SEQUENCE public.vacancies_vac_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vacancies_vac_id_seq OWNER TO jobuser;

--
-- Name: vacancies_vac_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: jobuser
--

ALTER SEQUENCE public.vacancies_vac_id_seq OWNED BY public.vacancies.vac_id;


--
-- Name: applications app_id; Type: DEFAULT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.applications ALTER COLUMN app_id SET DEFAULT nextval('public.applications_app_id_seq'::regclass);


--
-- Name: companies comp_id; Type: DEFAULT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.companies ALTER COLUMN comp_id SET DEFAULT nextval('public.companies_comp_id_seq'::regclass);


--
-- Name: contact_access_requests request_id; Type: DEFAULT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.contact_access_requests ALTER COLUMN request_id SET DEFAULT nextval('public.contact_access_requests_request_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: resumes res_id; Type: DEFAULT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.resumes ALTER COLUMN res_id SET DEFAULT nextval('public.resumes_res_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: vacancies vac_id; Type: DEFAULT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.vacancies ALTER COLUMN vac_id SET DEFAULT nextval('public.vacancies_vac_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.alembic_version (version_num) FROM stdin;
d52f4e1fb6e5
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.applications (app_id, res_id, vac_id, status, app_created_at) FROM stdin;
1	1	1	viewed	2026-11-16 20:53:26.490221
3	1	5	pending	2026-11-18 19:17:55.787846
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.companies (comp_id, user_id, comp_name, comp_region, address, size, comp_description, comp_phone, comp_email) FROM stdin;
1	6	компания	Московская область	адрес	размер	описание компании	телефон	email
5	7	СеверСофт	Москва	Деловой район, офис 101	51-200	Разработка корпоративных веб-систем и цифровых сервисов для бизнеса.	+7-900-000-0001	hello01@tail-hunted.test
6	8	Пиксельная	Санкт-Петербург	Деловой район, офис 102	11-50	Дизайн-студия, создающая интерфейсы цифровых продуктов и мобильных приложений.	+7-900-000-0002	hello02@tail-hunted.test
7	9	ДанныеПлюс	Московская область	Деловой район, офис 103	51-200	Команда аналитиков и инженеров данных для ритейла и финансового сектора.	+7-900-000-0003	hello03@tail-hunted.test
8	10	Маяк Маркетинг	Республика Татарстан	Деловой район, офис 104	11-50	Агентство интернет-маркетинга и продвижения брендов.	+7-900-000-0004	hello04@tail-hunted.test
9	11	ОблакоЛаб	Свердловская область	Деловой район, офис 105	51-200	Разрабатываем облачные платформы и инструменты автоматизации.	+7-900-000-0005	hello05@tail-hunted.test
10	12	ФинТех Платформа	Новосибирская область	Деловой район, офис 106	201-500	Финансовые технологии, платёжные решения и аналитические продукты.	+7-900-000-0006	hello06@tail-hunted.test
11	13	Умный Склад	Краснодарский край	Деловой район, офис 107	51-200	ИТ-решения для логистики, складов и управления поставками.	+7-900-000-0007	hello07@tail-hunted.test
12	14	Студия Формы	Нижегородская область	Деловой район, офис 108	1-10	Продуктовая дизайн-команда: исследования, UX/UI и визуальные системы.	+7-900-000-0008	hello08@tail-hunted.test
13	15	ЭкоДом	Самарская область	Деловой район, офис 109	11-50	Онлайн-сервис товаров для дома и экологичного образа жизни.	+7-900-000-0009	hello09@tail-hunted.test
14	16	Кодовая Практика	Ленинградская область	Деловой район, офис 110	51-200	Образовательная платформа и разработка внутренних цифровых продуктов.	+7-900-000-0010	hello10@tail-hunted.test
\.


--
-- Data for Name: contact_access_requests; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.contact_access_requests (request_id, resume_id, employer_id, candidate_id, status, created_at, updated_at) FROM stdin;
1	1	6	4	approved	2026-11-17 18:48:41.647492	2026-11-17 18:54:02.123647
2	9	6	19	pending	2026-11-18 19:19:06.520569	2026-11-18 19:19:06.520584
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.notifications (notification_id, user_id, app_id, title, message, notification_type, is_read, created_at) FROM stdin;
1	4	\N	Запрос контактных данных	Работодатель хочет получить доступ к вашему email. Рассмотрите запрос.	contact_request	t	2026-11-17 18:48:41.684007
2	6	\N	Ответ на запрос контактных данных	Кандидат разрешил просмотр email.	contact_response	t	2026-11-17 18:54:02.12755
3	9	3	Новый отклик	На вашу вакансию «Системный аналитик» поступил новый отклик	new_application	f	2026-11-18 19:17:55.801918
4	19	\N	Запрос контактных данных	Работодатель хочет получить доступ к вашему email. Рассмотрите запрос.	contact_request	f	2026-11-18 19:19:06.554855
\.


--
-- Data for Name: resumes; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.resumes (res_id, user_id, res_title, gender, birth_date, salary_expectation, professional_area, education, skills, experience, res_created_at, experience_level, preferred_region) FROM stdin;
7	17	Python-разработчик	male	1991-02-11	170000	Backend-разработка	Высшее образование, прикладная информатика.	Python, Django, FastAPI, PostgreSQL, Redis, Docker	3 года разрабатывал backend веб-сервисов. Проектировал REST API, оптимизировал SQL-запросы, писал тесты и участвовал в code review.	2026-11-18 19:16:39.731731	От 1 до 3 лет	Москва
8	18	UX/UI-дизайнер	female	1992-03-12	135000	Дизайн интерфейсов	Высшее образование, графический дизайн.	Figma, UX research, UI, прототипирование, дизайн-системы	Создавала интерфейсы личных кабинетов и мобильных приложений. Проводила базовые исследования и собирала интерактивные прототипы.	2026-11-18 19:16:39.908853	От 1 до 3 лет	Санкт-Петербург
9	19	Системный аналитик	male	1993-04-13	165000	Системный анализ	Высшее образование, бизнес-информатика.	SQL, BPMN, UML, REST API, Jira, Confluence	Описывал требования, моделировал процессы, готовил спецификации API и сопровождал задачи от постановки до приёмки.	2026-11-18 19:16:40.050539	Более 3 лет	Московская область
10	20	Интернет-маркетолог	female	1994-05-14	115000	Маркетинг	Высшее образование, маркетинг.	SEO, Яндекс Директ, веб-аналитика, контент, Excel	Вёл рекламные кампании, анализировал конверсию и готовил отчёты по эффективности каналов привлечения.	2026-11-18 19:16:40.208406	От 1 до 3 лет	Республика Татарстан
11	21	DevOps-инженер	male	1995-06-15	210000	DevOps	Высшее техническое образование.	Linux, Docker, Kubernetes, GitLab CI, Terraform	Поддерживал Linux-серверы, настраивал CI/CD, контейнеризацию и мониторинг тестовых и production-сред.	2026-11-18 19:16:40.351129	Более 3 лет	Свердловская область
12	22	Frontend-разработчик	female	1996-07-16	155000	Frontend-разработка	Высшее образование, программная инженерия.	JavaScript, React, TypeScript, HTML, CSS, Git	Разрабатывал SPA на React, интегрировал REST API, создавал адаптивные интерфейсы и поддерживал существующие компоненты.	2026-11-18 19:16:40.521376	От 1 до 3 лет	Новосибирская область
13	23	Специалист по логистике	male	1997-08-17	90000	Логистика	Среднее профессиональное образование, логистика.	Excel, 1С, документооборот, планирование поставок	Координировал отгрузки, взаимодействовал с перевозчиками, контролировал документы и сроки доставки.	2026-11-18 19:16:40.691362	От 1 до 3 лет	Краснодарский край
14	24	Младший графический дизайнер	female	1990-09-18	70000	Графический дизайн	Профильное образование, графический дизайн.	Figma, Photoshop, Illustrator, типографика	Учебные и небольшие коммерческие проекты: баннеры, презентации, оформление публикаций и простые макеты.	2026-11-18 19:16:40.852387	Без опыта	Нижегородская область
15	25	Менеджер электронной коммерции	male	1991-10-19	105000	Электронная коммерция	Высшее образование, менеджмент.	CRM, Excel, маркетплейсы, аналитика продаж	Работал с ассортиментом интернет-магазина, обновлял карточки товаров, анализировал продажи и готовил отчёты.	2026-11-18 19:16:40.991189	От 1 до 3 лет	Самарская область
16	26	QA-инженер	female	1992-11-20	125000	Тестирование ПО	Высшее образование, информационные системы.	Postman, SQL, функциональное тестирование, Jira	Тестировал веб-приложения вручную, составлял чек-листы и тест-кейсы, заводил дефекты и проверял исправления.	2026-11-18 19:16:41.128118	От 1 до 3 лет	Ленинградская область
1	4	должность	male	2006-07-21	1000000	какая-то профессиональная область	образование	навык1, навык2, навык3	опыта работы нет	2026-10-07 19:26:24.34416		Любой регион
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.users (user_id, user_email, password, last_name, first_name, middle_name, role) FROM stdin;
1	test@example.com	scrypt:32768:8:1$Ykn5lnpTYK3nJ7YG$b06d2efe37308237b60498c513aa26b3d685233a6840b945931e9ecd36bb206baddedcd3d53f0da1d9c569def6fd7f31a40e3aa36d9dd248c0b557362a9a8888	Иванов	Иван	Иванович	candidate
2	candidate@test.com	scrypt:32768:8:1$ViIhY3nnSuUCOh1U$398dabef5ff0d6026bcaa95db7cb99c577a812ec13d2d696ce8d32ebcc2fdb6a921093a3f72f7ffdd98f617dd114b4b608b41849df765b957ca0c0b5afe22132	Иванов	Иван	Иванович	candidate
3	hr@test.com	scrypt:32768:8:1$hjQXricSnAjQOS28$cd3c087f4fafa370b9bb6ea1fc60542f1f366f6673c88be07d3489314d83e50fa1b49fe346284153c74bc26d8852f01355fb0fb07513ac06e3a1201909fed039	Петров	Пётр	Петрович	employer
4	kvdmitrym@gmail.com	scrypt:32768:8:1$ouT7hmIdBMc7dt4j$416abb1101763f436898ca5d6c5cff669c97c4b0df591dffa6afdeaddf39ade5fc38a69db0c4fb3e61de7dad31a6ccdf15494fa605910a65fb3d142f49f6076f	Кисвянцев	Дмитрий	Михайлович	candidate
5	kvdmitrym45645546@gmail.com	scrypt:32768:8:1$nMYiBLlRp3hvhSb0$1b14c933da040820e9b42792fcb9fd52b87185aa060e60cdb0a2cc6b004d9a1bf6a2b63ad4d11271fadc171a8cbb2c1f418a93ecae8379697f7d8120127d9c3b	Кисвянцев	Дмитрий	Михайлович	candidate
6	rabotodatel@work.ru	scrypt:32768:8:1$oSFXkDDfX0xlXgSU$426d8a5299c038308ebc55ea869cb1d053ddebf206bf152864afdbce41db005f63bc02e72d4dfabd11820ee489652f44e01e927fd79a7e6827fa09b818255924	Работодателев	Работодатель	Работодателевич	employer
7	demo.employer01@tail-hunted.test	scrypt:32768:8:1$tLQRfe6cHsSbApPR$57097e7d6254b40d42278ea3d6bd73d6f9f996e42d309a0fb159c0311abc68f62b2f7611f8d39b018175dcdec274d1f14cf1eb0f1c19862e54e05acfd12f621f	Петров	Иван	Сергеевич	employer
8	demo.employer02@tail-hunted.test	scrypt:32768:8:1$LtqiksGNfCsWjrzN$2f71f73b3a5d5bd6a80edc54179bbbc49fe3e6570e87230212521c386bc03fc78da1a9d4ee225e83e1c5de50ce89e3371100c489c6c0ce90cf1e1b5903c05d07	Соколова	Мария	Андреевна	employer
9	demo.employer03@tail-hunted.test	scrypt:32768:8:1$yIDdz2UfTYawPGRZ$9a2b2c07a2ba3da65d004058dc6806995f4966b788d25a1edcc050a0b343242cd5bb7e1e7c985f58b4988669151caa6c3914637df5ef4aef0ca1a60307b50d8a	Морозов	Алексей	Игоревич	employer
10	demo.employer04@tail-hunted.test	scrypt:32768:8:1$dbgxcCRK2L5yJlgH$fbc3cda2239075ee35cfc64638a64ad5edae2009cf57e4485df125f07fa341dfcd09924dafac403d1b17e3ea3fda2a1ed9c406ce0790142a67b5bf12c1db00bf	Волкова	Екатерина	Дмитриевна	employer
11	demo.employer05@tail-hunted.test	scrypt:32768:8:1$6IAsNUZ5VHA9hgay$9e5efdc20e62993454741b937a753cac475e1017c3b060a86fb958819b0d2d5dccedb1dfe58d6ecc81bef3f1080ac361f87e69b9bae112f3ccfb2fde2f6a8772	Кузнецов	Дмитрий	Олегович	employer
12	demo.employer06@tail-hunted.test	scrypt:32768:8:1$0rDvQAVOVevGpaML$410442b717bc44f2c53a8d7fe46389947ab1826be01447089916cbbec5debd2a9393eca00ad0661763dbcecda9631d1013501292e3f35ff3b42344e0bd8a94a5	Попова	Анна	Владимировна	employer
13	demo.employer07@tail-hunted.test	scrypt:32768:8:1$uEd98wJZsh3VZzGa$f5658c9dd5e5f01c7877524f66614810aa9d629dab923334879299e469f41da400b4ca5e97927b32ef276e53da9f21804c2ab1a00e06f1e9b002e2c50c5f258a	Лебедев	Сергей	Павлович	employer
14	demo.employer08@tail-hunted.test	scrypt:32768:8:1$9O7tBkCqlSuimBkL$bc6d68d8c7bfc800d955296e24bb8534765f3e765d2c9c363a1a89400b4d195a0b2e9e152f8daf6491b2d0210fb2ce41ef996f5b532deb83ed14b89ea2a0ee14	Новикова	Ольга	Романовна	employer
15	demo.employer09@tail-hunted.test	scrypt:32768:8:1$OPf5ekSVbmZwnl30$decad9eb98564fd88b3cd0ddbbaa9bcb36cf922fe1838fa52c1db015cb4868e5ca92bb6eabf9202da93df74314ce6d5619166c31b2fedd56c51b2b456be15444	Фёдоров	Михаил	Алексеевич	employer
16	demo.employer10@tail-hunted.test	scrypt:32768:8:1$MAxy6VgoBCUlww7R$997910e7233ab80fa8ab54b72129108bd4d4cd2eb0fe6cc637563afd331e2f28454dbe2ef4952b2dad84f1df0ccd55e493709b47ddae13cf2339c70c7a680935	Беляева	Наталья	Ильинична	employer
17	demo.candidate01@tail-hunted.test	scrypt:32768:8:1$s8oPQnDWfKEYZl5h$a9bf44991ecefd2ead701fa7321c5d61fdb566b9146f6815dc64b269f803d23b278847d64bdfc4106d98eb9e940891fffc2eba5f495b76f1a6563c68420fd55e	Смирнов	Артём	Ильич	candidate
18	demo.candidate02@tail-hunted.test	scrypt:32768:8:1$nqeu1qiPMixBkRuH$e16ed6815d785246f73220b51ee06c91476620c264c5eebc1d461a4bda27b52c4ce4468ffc6e5b6c4af9627513256602d393801dce59badb4143349c2fcfbb33	Козлова	София	Максимовна	candidate
19	demo.candidate03@tail-hunted.test	scrypt:32768:8:1$lHCdylAvHD3ShMEs$0bfac1f38d85891e85c4d07d7a9d7207e289d9b087ba14ebe111b40e39c13ae93b6345583bbf80cabce572b58cba6e11a5c832e141d7a9502713823925e322dc	Орлов	Максим	Денисович	candidate
20	demo.candidate04@tail-hunted.test	scrypt:32768:8:1$wkHPkEfZuoaf06eT$994c22f499fc0a1fa9a8a1fc2440a69a1dd5f9c033ad935795c2c40bdbc4595ec62011dd63719933c82df396284be653437ba0b087fed9dc7734cc45a6488356	Андреева	Виктория	Петровна	candidate
21	demo.candidate05@tail-hunted.test	scrypt:32768:8:1$Q3ZoR0VzqTXfmKqW$7bef0e12bee4c769168dd3d3987987b74b98657a768c92cae7f10d00b49d9155a1bee04eb597c56371ab8412a50967378596727ccc7d8d53e1d774f50570d0b6	Зайцев	Кирилл	Михайлович	candidate
22	demo.candidate06@tail-hunted.test	scrypt:32768:8:1$IRoKRAv5whCnqJ6v$7293b99abd0011458b1eef8d29190e5c3b740236026a4b4457bfc6d19fe253e4bb7961f123f90d5a01c776335bf92915ce3071b7bae92b8da0ebb0c5cc0823d4	Григорьева	Алиса	Евгеньевна	candidate
23	demo.candidate07@tail-hunted.test	scrypt:32768:8:1$sqsbUNpYPNyp5fNI$d9db442913fbfbe433cb836b314eddf629782aef4f45585340b0fc0b820901f5a01d28d634f6761878533e5f48c8042503ec7e17e7f4222ee88e42b6da9d8869	Павлов	Роман	Артёмович	candidate
24	demo.candidate08@tail-hunted.test	scrypt:32768:8:1$GC1vqqw0FMAlzDRk$ad44326a0af02be07fb0a2cd3033cb5a921185660baa21d9d8813e44811e382ca5d7ac3fb51a557bfae15747473369e28da870f2812f964d9b5203af56b4edda	Семёнова	Полина	Игоревна	candidate
25	demo.candidate09@tail-hunted.test	scrypt:32768:8:1$9Pmuzp5I5wkoUDcK$ca97f0c0a9522b05b81482806598421df7be286ef4c3ff7fa0d0473c53ac7f03d03bc7391b7f6bd0dbecb8b2fff2d902234cba89ab2e0be5934a33ce39134657	Васильев	Егор	Николаевич	candidate
26	demo.candidate10@tail-hunted.test	scrypt:32768:8:1$8aGpXhwqFxtRhARq$f635699bc8b0a23c8048607a9f2c2df161fb39c5e970d15df1f2ed503f425ec80d92a16c64c4f1670f3a68d8ed644b2a8ef25c88ac69872ac354b176ab80cc06	Михайлова	Дарья	Сергеевна	candidate
\.


--
-- Data for Name: vacancies; Type: TABLE DATA; Schema: public; Owner: jobuser
--

COPY public.vacancies (vac_id, comp_id, vac_title, specialization, hiring_plan, employment_type, schedule, salary, experience_required, skills_required, vac_description, vac_region, vac_created_at) FROM stdin;
3	5	Python-разработчик	Backend-разработка	1	full	5/2	180000	От 1 до 3 лет	Python, Django, PostgreSQL, REST API	Разработка и поддержка backend-сервисов, проектирование API, оптимизация запросов и участие в code review.	Москва	2026-11-18 19:16:38.124517
4	6	UX/UI-дизайнер	Дизайн	1	full	Гибкий	145000	От 1 до 3 лет	Figma, UX, UI, прототипирование, дизайн-системы	Проектирование пользовательских сценариев, создание прототипов и развитие дизайн-системы продукта.	Санкт-Петербург	2026-11-18 19:16:38.286103
5	7	Системный аналитик	Аналитика	2	full	5/2	170000	Более 3 лет	SQL, UML, BPMN, REST API, документация	Сбор требований, описание бизнес-процессов, подготовка технических заданий и взаимодействие с разработчиками.	Московская область	2026-11-18 19:16:38.452477
6	8	Маркетолог	Маркетинг	1	full	5/2	120000	От 1 до 3 лет	Яндекс Директ, аналитика, SEO, контент	Планирование рекламных кампаний, анализ эффективности каналов и подготовка предложений по росту.	Республика Татарстан	2026-11-18 19:16:38.611614
7	9	DevOps-инженер	Инфраструктура	1	full	Удалённо	220000	Более 3 лет	Docker, Kubernetes, Linux, CI/CD, облака	Поддержка инфраструктуры, автоматизация поставки приложений, мониторинг и повышение надёжности сервисов.	Свердловская область	2026-11-18 19:16:38.756461
8	10	Frontend-разработчик	Frontend-разработка	2	full	5/2	160000	От 1 до 3 лет	JavaScript, React, TypeScript, HTML, CSS	Разработка интерфейсов веб-приложений, интеграция с API и улучшение производительности.	Новосибирская область	2026-11-18 19:16:38.956225
9	11	Специалист по логистике	Логистика	1	full	2/2	95000	От 1 до 3 лет	Excel, логистика, 1С, документооборот	Координация поставок, контроль сроков, работа с перевозчиками и складскими подразделениями.	Краснодарский край	2026-11-18 19:16:39.115211
10	12	Графический дизайнер	Дизайн	1	project	Гибкий	100000	Без опыта	Figma, Photoshop, Illustrator, композиция	Подготовка графических материалов для цифровых каналов и рекламных кампаний под руководством арт-директора.	Нижегородская область	2026-11-18 19:16:39.259445
11	13	Менеджер интернет-магазина	Электронная коммерция	2	full	5/2	110000	От 1 до 3 лет	Excel, CRM, аналитика продаж, маркетплейсы	Управление ассортиментом и карточками товаров, анализ продаж и координация операционных задач.	Самарская область	2026-11-18 19:16:39.400638
12	14	QA-инженер	Тестирование	1	full	5/2	135000	От 1 до 3 лет	Тестирование, Postman, SQL, баг-трекинг	Функциональное и интеграционное тестирование веб-продукта, оформление дефектов и проверка исправлений.	Ленинградская область	2026-11-18 19:16:39.5664
1	1	вакансия	специализация	10000	full	7/0	1	Более 15 лет	навык1, навык3, навык5	описание вакансии	Московская область	2026-10-07 19:48:39.637662
\.


--
-- Name: applications_app_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jobuser
--

SELECT pg_catalog.setval('public.applications_app_id_seq', 3, true);


--
-- Name: companies_comp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jobuser
--

SELECT pg_catalog.setval('public.companies_comp_id_seq', 14, true);


--
-- Name: contact_access_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jobuser
--

SELECT pg_catalog.setval('public.contact_access_requests_request_id_seq', 2, true);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jobuser
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 5, true);


--
-- Name: resumes_res_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jobuser
--

SELECT pg_catalog.setval('public.resumes_res_id_seq', 16, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jobuser
--

SELECT pg_catalog.setval('public.users_user_id_seq', 26, true);


--
-- Name: vacancies_vac_id_seq; Type: SEQUENCE SET; Schema: public; Owner: jobuser
--

SELECT pg_catalog.setval('public.vacancies_vac_id_seq', 12, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (app_id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (comp_id);


--
-- Name: companies companies_user_id_key; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);


--
-- Name: contact_access_requests contact_access_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.contact_access_requests
    ADD CONSTRAINT contact_access_requests_pkey PRIMARY KEY (request_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: resumes resumes_pkey; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_pkey PRIMARY KEY (res_id);


--
-- Name: resumes resumes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_user_id_key UNIQUE (user_id);


--
-- Name: applications uq_resume_vacancy; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT uq_resume_vacancy UNIQUE (res_id, vac_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: vacancies vacancies_pkey; Type: CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.vacancies
    ADD CONSTRAINT vacancies_pkey PRIMARY KEY (vac_id);


--
-- Name: ix_users_user_email; Type: INDEX; Schema: public; Owner: jobuser
--

CREATE UNIQUE INDEX ix_users_user_email ON public.users USING btree (user_email);


--
-- Name: applications applications_res_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_res_id_fkey FOREIGN KEY (res_id) REFERENCES public.resumes(res_id);


--
-- Name: applications applications_vac_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_vac_id_fkey FOREIGN KEY (vac_id) REFERENCES public.vacancies(vac_id);


--
-- Name: companies companies_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: contact_access_requests contact_access_requests_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.contact_access_requests
    ADD CONSTRAINT contact_access_requests_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.users(user_id);


--
-- Name: contact_access_requests contact_access_requests_employer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.contact_access_requests
    ADD CONSTRAINT contact_access_requests_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.users(user_id);


--
-- Name: contact_access_requests contact_access_requests_resume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.contact_access_requests
    ADD CONSTRAINT contact_access_requests_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(res_id);


--
-- Name: notifications notifications_app_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_app_id_fkey FOREIGN KEY (app_id) REFERENCES public.applications(app_id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: resumes resumes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.resumes
    ADD CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: vacancies vacancies_comp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: jobuser
--

ALTER TABLE ONLY public.vacancies
    ADD CONSTRAINT vacancies_comp_id_fkey FOREIGN KEY (comp_id) REFERENCES public.companies(comp_id);


--
-- PostgreSQL database dump complete
--

\unrestrict QIF21GUdjVvaIZj4ji70yJ1K4gdZkr8Ul2lKOeXVbpkEMWTQdB8ylo2ln5n5zZC

