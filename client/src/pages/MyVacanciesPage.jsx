import { useState } from "react";
import { Link } from "react-router-dom";
import { useLoad } from "../hooks/useLoad";
import { apiError, EMPLOYMENT_LABELS, formatSalary } from "../utils/format";
import { vacancyService } from "../services/vacancyService";

export default function MyVacanciesPage() {
  const { data, setData, loading, error } = useLoad(() => vacancyService.getMy());
  const [actionError, setActionError] = useState("");

  const vacancies = data || [];

  const remove = async (vacancy) => {
    if (!window.confirm(`Удалить вакансию «${vacancy.vac_title}»?`)) return;

    setActionError("");
    try {
      await vacancyService.remove(vacancy.vac_id);
      setData(vacancies.filter((v) => v.vac_id !== vacancy.vac_id));
    } catch (err) {
      setActionError(apiError(err, "Не удалось удалить вакансию"));
    }
  };

  return (
    <div className="auth-container">
      <div className="row-between">
        <h1>Мои вакансии</h1>
        <Link to="/vacancy/new" className="btn-primary">+ Новая вакансия</Link>
      </div>

      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}
      {loading && <p className="muted">Загрузка…</p>}
      {!loading && vacancies.length === 0 && <div className="empty">Вакансий пока нет.</div>}

      {vacancies.map((v) => (
        <div key={v.vac_id} className="card row-between" style={{ alignItems: "flex-start" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3>{v.vac_title}</h3>
            <div className={`job-salary ${v.salary ? "" : "missing"}`}>{formatSalary(v.salary) || "Зарплата не указана"}</div>
            <p className="muted">
              {[v.vac_region, EMPLOYMENT_LABELS[v.employment_type]].filter(Boolean).join(" · ")}
            </p>
            <p className="muted">
              Откликов: {v.applications_total}
              {v.applications_new > 0 && <span className="badge warn" style={{ marginLeft: 8 }}>без ответа: {v.applications_new}</span>}
            </p>
          </div>
          <div className="vacancy-card-actions">
            <Link to={`/vacancy/${v.vac_id}/applications`} className="btn-small">Отклики</Link>
            <Link to={`/vacancy/${v.vac_id}/edit`} className="btn-small">Изменить</Link>
            <button className="btn-small danger" onClick={() => remove(v)}>Удалить</button>
          </div>
        </div>
      ))}
    </div>
  );
}
