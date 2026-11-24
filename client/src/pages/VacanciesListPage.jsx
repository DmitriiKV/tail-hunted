import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchFilters from "../components/SearchFilters";
import { apiError, EMPLOYMENT_LABELS, formatSalary } from "../utils/format";
import { sortKeepingRank } from "../utils/sort";
import { applicationService } from "../services/applicationService";
import { matchingService } from "../services/matchingService";
import { VACANCY_SCHEDULE_OPTIONS } from "../constants/schedules";
import { REGIONS } from "../constants/regions";
import MatchPanel from "../components/MatchPanel";

const EMPTY_EXPERIENCE = { type: "", min: "", max: "", more: "" };
const INITIAL_FILTERS = {
  q: "",
  region: "",
  min_salary: "",
  employment_type: "",
  schedule: "",
  experience: EMPTY_EXPERIENCE,
  skills: "",
};

const FIELDS = [
  { name: "region", label: "Регион", type: "select", options: REGIONS.map((region) => ({ value: region, label: region })) },
  { name: "min_salary", label: "Зарплата от, ₽", type: "number" },
  {
    name: "employment_type",
    label: "Занятость",
    type: "select",
    options: Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => ({ value, label })),
  },
  { name: "schedule", label: "График", type: "select", options: VACANCY_SCHEDULE_OPTIONS },
  { name: "experience", label: "Опыт", type: "experience" },
  { name: "skills", label: "Навыки", placeholder: "Например, Python" },
];

const toParams = (filters) => {
  const params = Object.fromEntries(
    Object.entries(filters)
      .filter(([key]) => key !== "experience")
      .map(([key, value]) => [key, String(value ?? "").trim()])
      .filter(([, value]) => value !== "")
  );

  const exp = filters.experience;
  if (exp?.type) {
    params.experience_type = exp.type;
    if (exp.type === "range") {
      if (exp.min !== "") params.experience_min = exp.min;
      if (exp.max !== "") params.experience_max = exp.max;
    }
    if (exp.type === "more" && exp.more !== "") params.experience_more = exp.more;
  }
  return params;
};

export default function VacanciesListPage() {
  const [vacancies, setVacancies] = useState([]);
  const [applied, setApplied] = useState(new Set());
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sort, setSort] = useState("match");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const data = await matchingService.getRecommendedVacancies(toParams(filters));
        if (active) setVacancies(data.map((item) => ({ ...item.vacancy, match: item.match })));
      } catch (err) {
        if (active) setError(apiError(err, "Не удалось загрузить вакансии"));
      } finally {
        if (active) setLoading(false);
      }
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters]);

  useEffect(() => {
    applicationService
      .mine()
      .then((list) => setApplied(new Set(list.map((a) => a.vac_id))))
      .catch(() => {});
  }, []);

  const sorted = useMemo(
    () => sortKeepingRank(vacancies, sort, { dateKey: "vac_created_at", salaryKey: "salary" }),
    [vacancies, sort]
  );

  const handleChange = ({ target: { name, value } }) =>
    setFilters((prev) => ({ ...prev, [name]: value }));

  const apply = async (vacId) => {
    setApplyingId(vacId);
    setApplyError("");
    try {
      await applicationService.create(vacId);
      setApplied((prev) => new Set(prev).add(vacId));
    } catch (err) {
      setApplyError(apiError(err, "Не удалось отправить отклик"));
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="auth-container">
      <h1>Вакансии</h1>
      <SearchFilters
        filters={filters}
        fields={FIELDS}
        onChange={handleChange}
        onReset={() => setFilters(INITIAL_FILTERS)}
        sort={sort}
        onSortChange={setSort}
        searchPlaceholder="Должность, компания, навыки или ключевое слово"
      />

      {error && <p className="error">{error}</p>}
      {applyError && <p className="error">{applyError}</p>}
      {!loading && !error && (
        <p className="muted result-meta">
          Найдено {sorted.length} вакансий
        </p>
      )}
      {loading && <p className="muted result-meta">Подбираем…</p>}
      {!loading && !error && sorted.length === 0 && (
        <div className="empty">Ничего не найдено. Уберите часть фильтров или дополните резюме.</div>
      )}

      {sorted.map((v) => {
        const salary = formatSalary(v.salary);
        return (
          <div key={v.vac_id} className="card job-card row-between" style={{ alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3><Link to={`/vacancy/${v.vac_id}`}>{v.vac_title}</Link></h3>
              <div className={`job-salary ${salary ? "" : "missing"}`}>{salary || "Зарплата не указана"}</div>
              <p className="muted">
                {[v.comp_name, v.vac_region, v.experience_required, EMPLOYMENT_LABELS[v.employment_type], v.schedule]
                  .filter(Boolean).join(" · ")}
              </p>
              {v.skills_required && <p>{v.skills_required}</p>}
              <MatchPanel match={v.match} title="Совпадение с вашим резюме" missingTitle="Не хватает навыков:" />
            </div>
            {applied.has(v.vac_id) ? (
              <span className="badge ok">Вы откликнулись</span>
            ) : (
              <button className="btn-small" disabled={applyingId === v.vac_id} onClick={() => apply(v.vac_id)}>
                {applyingId === v.vac_id ? "Отправляем…" : "Откликнуться"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
