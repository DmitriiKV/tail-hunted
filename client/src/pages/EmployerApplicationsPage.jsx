import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useLoad } from "../hooks/useLoad";
import { apiError, formatDate, formatSalary } from "../utils/format";
import { APPLICATION_STATUS, scoreTone } from "../constants/status";
import { applicationService } from "../services/applicationService";

function ApplicationCard({ application, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = async (status) => {
    setBusy(true);
    setError("");
    try {
      onChange(await applicationService.setStatus(application.app_id, status));
    } catch (err) {
      setError(apiError(err, "Не удалось изменить статус"));
    } finally {
      setBusy(false);
    }
  };

  const { resume } = application;
  const open = application.status === "pending" || application.status === "viewed";

  return (
    <div className="card">
      <div className="row-between">
        <h3>{resume.res_title}</h3>
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
      {application.missing_skills.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          <span className="muted">Нет навыков:</span>
          {application.missing_skills.map((skill) => (
            <span key={skill} className="chip bad">{skill}</span>
          ))}
        </div>
      )}
      <p className="muted">Отклик от {formatDate(application.app_created_at)}</p>

      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn-small" to={`/application/${application.app_id}/resume`}>
          Открыть резюме
        </Link>
        {open && (
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

export default function EmployerApplicationsPage() {
  const { id } = useParams();
  const { data, setData, loading, error } = useLoad(() => applicationService.forVacancy(id), [id]);
  const items = data || [];

  const replace = (updated) =>
    setData(items.map((a) => (a.app_id === updated.app_id ? { ...a, ...updated } : a)));

  return (
    <div className="auth-container">
      <Link to="/my-vacancies" className="muted">← Мои вакансии</Link>
      <h1 style={{ marginTop: 8 }}>Отклики на вакансию</h1>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загрузка…</p>}
      {!loading && !error && items.length === 0 && <div className="empty">Откликов пока нет.</div>}
      {items.map((application) => (
        <ApplicationCard key={application.app_id} application={application} onChange={replace} />
      ))}
    </div>
  );
}
