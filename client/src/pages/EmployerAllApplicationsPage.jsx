import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useLoad } from "../hooks/useLoad";
import { apiError, formatDate, formatSalary } from "../utils/format";
import { APPLICATION_STATUS, scoreTone } from "../constants/status";
import { applicationService } from "../services/applicationService";
import { vacancyService } from "../services/vacancyService";

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "pending", label: "Новые" },
  { key: "viewed", label: "Просмотренные" },
  { key: "invited", label: "Приглашения" },
  { key: "rejected", label: "Отказы" },
];

function loadAllApplications() {
  return vacancyService.getMy().then(async (vacancies) => {
    const groups = await Promise.all(
      vacancies.map(async (vacancy) => {
        const applications = await applicationService.forVacancy(vacancy.vac_id);
        return applications.map((application) => ({
          ...application,
          vacancy_title: vacancy.vac_title,
        }));
      })
    );

    return groups.flat().sort(
      (a, b) => new Date(b.app_created_at).getTime() - new Date(a.app_created_at).getTime()
    );
  });
}

function ApplicationCard({ application, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const resume = application.resume || {};

  const update = async (status) => {
    setBusy(true);
    setError("");
    try {
      const updated = await applicationService.setStatus(application.app_id, status);
      onChange({ ...application, ...updated });
    } catch (err) {
      setError(apiError(err, "Не удалось изменить статус"));
    } finally {
      setBusy(false);
    }
  };

  const canRespond = ["pending", "viewed"].includes(application.status);
  const missingSkills = application.missing_skills || [];

  return (
    <div className="card">
      <div className="row-between">
        <div>
          <div className="muted">Вакансия: {application.vacancy_title}</div>
          <h3>{resume.res_title || "Резюме кандидата"}</h3>
        </div>
        <div className="row">
          <span className={`match-score ${scoreTone(application.score)}`} style={{ fontSize: 20, minWidth: 0 }}>
            {application.score}%
          </span>
          <StatusBadge map={APPLICATION_STATUS} status={application.status} />
        </div>
      </div>

      <p className="muted">
        {[resume.professional_area, resume.experience_level, formatSalary(resume.salary_expectation)]
          .filter(Boolean)
          .join(" · ")}
      </p>

      {missingSkills.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          <span className="muted">Не указаны навыки:</span>
          {missingSkills.map((skill) => (
            <span key={skill} className="chip bad">{skill}</span>
          ))}
        </div>
      )}

      <p className="muted">Отклик от {formatDate(application.app_created_at)}</p>

      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn-small" to={`/application/${application.app_id}/resume`}>
          Открыть резюме
        </Link>
        {canRespond && (
          <>
            <button className="btn-small" disabled={busy} onClick={() => update("invited")}>
              Пригласить
            </button>
            <button className="btn-small danger" disabled={busy} onClick={() => update("rejected")}>
              Отказать
            </button>
          </>
        )}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default function EmployerAllApplicationsPage() {
  const { data, setData, loading, error } = useLoad(loadAllApplications);
  const [filter, setFilter] = useState("all");
  const items = data || [];

  const counts = useMemo(
    () => FILTERS.reduce((result, item) => {
      result[item.key] = item.key === "all"
        ? items.length
        : items.filter((application) => application.status === item.key).length;
      return result;
    }, {}),
    [items]
  );

  const visible = items.filter((application) => {
    if (filter === "all") return true;
    if (filter === "pending") return application.status === "pending";
    return application.status === filter;
  });

  const replace = (updated) =>
    setData(items.map((application) =>
      application.app_id === updated.app_id ? updated : application
    ));

  return (
    <div className="auth-container">
      <Link to="/" className="muted">← На главную</Link>
      <h1 style={{ marginTop: 8 }}>Все отклики</h1>

      <div className="tabs">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={filter === key ? "active" : ""}
            onClick={() => setFilter(key)}
          >
            {label} ({counts[key] || 0})
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загрузка откликов…</p>}
      {!loading && !error && visible.length === 0 && (
        <div className="empty">
          {filter === "all" ? "Откликов пока нет." : "В этой категории пока нет откликов."}
        </div>
      )}

      {visible.map((application) => (
        <ApplicationCard
          key={application.app_id}
          application={application}
          onChange={replace}
        />
      ))}
    </div>
  );
}
