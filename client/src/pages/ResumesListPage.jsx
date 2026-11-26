import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchFilters from "../components/SearchFilters";
import { apiError, formatSalary } from "../utils/format";
import { salaryOf, sortKeepingRank } from "../utils/sort";
import { matchingService } from "../services/matchingService";
import { vacancyService } from "../services/vacancyService";
import { SCHEDULE_OPTIONS } from "../constants/schedules";
import { REGIONS } from "../constants/regions";
import { matchesExperienceFilter } from "../utils/experience";

const PER_PAGE = 10;
const EMPTY_EXPERIENCE = { type: "", min: "", max: "", more: "" };

const INITIAL_FILTERS = {
  q: "",
  max_salary: "",
  skills: "",
  experience: EMPTY_EXPERIENCE,
  region: "",
  schedule: "",
};

const FIELDS = [
  { name: "max_salary", label: "Зарплата до, ₽", type: "number" },
  { name: "skills", label: "Навыки", placeholder: "Например, Python" },
  { name: "experience", label: "Опыт", type: "experience" },
  { name: "region", label: "Предпочтительный регион", type: "select", options: REGIONS.map((region) => ({ value: region, label: region })) },
  { name: "schedule", label: "Предпочтительный график", type: "select", options: SCHEDULE_OPTIONS },
];

const norm = (value) => String(value ?? "").toLowerCase().replaceAll("ё", "е").trim();
const has = (haystack, needle) => !needle.trim() || norm(haystack).includes(norm(needle));

function matchesFilters(resume, filters) {
  const salary = salaryOf(resume.salary_expectation);
  const schedules = Array.isArray(resume.preferred_schedule) ? resume.preferred_schedule : [];
  const everything = [
    resume.res_title,
    resume.professional_area,
    resume.skills,
    resume.education,
    resume.experience,
    resume.experience_level,
    resume.preferred_region,
    ...schedules,
  ].join(" ");

  return (
    has(everything, filters.q) &&
    has(resume.skills, filters.skills) &&
    (!filters.region || norm(resume.preferred_region) === norm("Любой регион") ||
      norm(resume.preferred_region) === norm(filters.region)) &&
    matchesExperienceFilter(resume.experience_level, filters.experience) &&
    (!filters.schedule || schedules.includes("Не имеет значения") || schedules.includes(filters.schedule)) &&
    (filters.max_salary === "" || (salary !== null && salary <= Number(filters.max_salary)))
  );
}

export default function ResumesListPage() {
  const [vacancies, setVacancies] = useState(null);
  const [vacancyId, setVacancyId] = useState("");
  const [result, setResult] = useState({ vacancyId: "", resumes: [], error: "" });
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sort, setSort] = useState("match");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    vacancyService.getMy()
      .then((list) => {
        setVacancies(list);
        if (list.length > 0) setVacancyId(String(list[0].vac_id));
      })
      .catch((err) => {
        setVacancies([]);
        setError(apiError(err, "Не удалось загрузить ваши вакансии"));
      });
  }, []);

  useEffect(() => {
    if (!vacancyId) return undefined;
    let active = true;
    matchingService.getRecommendedResumes(vacancyId)
      .then((data) => {
        if (active) setResult({ vacancyId, resumes: data.map((item) => ({ ...item.resume, match: item.match })), error: "" });
      })
      .catch((err) => {
        if (active) setResult({ vacancyId, resumes: [], error: apiError(err, "Не удалось загрузить кандидатов") });
      });
    return () => { active = false; };
  }, [vacancyId]);

  const loading = Boolean(vacancyId) && result.vacancyId !== vacancyId;
  const resumes = result.resumes;

  const visible = useMemo(() => {
    const filtered = resumes.filter((resume) => matchesFilters(resume, filters));
    return sortKeepingRank(filtered, sort, { dateKey: "res_created_at", salaryKey: "salary_expectation" });
  }, [resumes, filters, sort]);

  const pages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const current = Math.min(page, pages);
  const pageItems = visible.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const handleChange = ({ target: { name, value } }) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  if (vacancies === null) return <p className="muted">Загрузка…</p>;

  if (vacancies.length === 0) {
    return (
      <div className="auth-container">
        <h1>Кандидаты</h1>
        <div className="empty">
          Чтобы искать кандидатов, нужна хотя бы одна активная вакансия. <Link to="/vacancy/new">Создать вакансию</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <h1>Кандидаты</h1>
      <div className="card">
        <label htmlFor="vacancy">Подбираем под вакансию</label>
        <select id="vacancy" value={vacancyId} onChange={(e) => { setVacancyId(e.target.value); setPage(1); }}>
          {vacancies.map((vacancy) => (
            <option key={vacancy.vac_id} value={vacancy.vac_id}>{vacancy.vac_title}</option>
          ))}
        </select>
      </div>

      <SearchFilters
        filters={filters}
        fields={FIELDS}
        onChange={handleChange}
        onReset={() => { setFilters(INITIAL_FILTERS); setPage(1); }}
        sort={sort}
        onSortChange={setSort}
        searchPlaceholder="Должность, навыки, опыт или ключевое слово"
      />

      {(error || (result.vacancyId === vacancyId && result.error)) && (
        <p className="error">{error || result.error}</p>
      )}
      {loading && <p className="muted result-meta">Подбираем…</p>}
      {!loading && !error && result.vacancyId === vacancyId && !result.error && (
        <p className="muted result-meta">
          Найдено {visible.length} резюме
        </p>
      )}
      {!loading && !error && result.vacancyId === vacancyId && !result.error && visible.length === 0 && (
        <div className="empty">Подходящих резюме не нашлось.</div>
      )}

      {pageItems.map((resume) => (
        <div key={resume.res_id} className="card job-card row-between" style={{ alignItems: "flex-start" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3>
              <Link to={`/resume/${resume.res_id}`} state={{ vacancyId: Number(vacancyId) }}>
                {resume.res_title}
              </Link>
            </h3>
            <div className={`job-salary ${resume.salary_expectation ? "" : "missing"}`}>
              {formatSalary(resume.salary_expectation) || "Ожидания по зарплате не указаны"}
            </div>
            <p className="muted">
              {[resume.professional_area, resume.experience_level, resume.preferred_region,
                ...(resume.preferred_schedule || [])].filter(Boolean).join(" · ")}
            </p>
            {resume.skills && <p>{resume.skills}</p>}
          </div>
        </div>
      ))}

      {pages > 1 && (
        <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
          <button disabled={current === 1} onClick={() => setPage(current - 1)}>Назад</button>
          <span className="muted">{current} из {pages}</span>
          <button disabled={current === pages} onClick={() => setPage(current + 1)}>Вперёд</button>
        </div>
      )}
    </div>
  );
}
