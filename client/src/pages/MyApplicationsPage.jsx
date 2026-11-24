import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useLoad } from "../hooks/useLoad";
import { formatDate, formatSalary } from "../utils/format";
import { APPLICATION_STATUS } from "../constants/status";
import { applicationService } from "../services/applicationService";

const FILTERS = [
  { key: "all", label: "Все" },
  { key: "pending", label: "Ждут ответа" },
  { key: "invited", label: "Приглашения" },
  { key: "rejected", label: "Отказы" },
];

export default function MyApplicationsPage() {
  const { data, setData, loading, error } = useLoad(() => applicationService.mine());
  const [filter, setFilter] = useState("all");
  const [confirmingId, setConfirmingId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState("");

  const cancelApplication = async (appId) => {
    setBusyId(appId);
    setActionError("");
    try {
      await applicationService.cancel(appId);
      setData(items.filter((item) => item.app_id !== appId));
      setConfirmingId(null);
    } catch (err) {
      setActionError(err?.response?.data?.error || "Не удалось отменить отклик");
    } finally {
      setBusyId(null);
    }
  };

  const items = data || [];
  const visible = items.filter((a) =>
    filter === "all" ? true : filter === "pending" ? ["pending", "viewed"].includes(a.status) : a.status === filter
  );

  return (
    <div className="auth-container">
      <h1>Мои отклики</h1>

      <div className="tabs">
        {FILTERS.map(({ key, label }) => (
          <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      {error && <p className="error">{error}</p>}
      {actionError && <p className="error">{actionError}</p>}
      {loading && <p className="muted">Загрузка…</p>}
      {!loading && visible.length === 0 && (
        <div className="empty">
          Здесь пусто. <Link to="/vacancies">Посмотреть вакансии</Link>
        </div>
      )}

      {visible.map((application) => (
        <div key={application.app_id} className="card">
          <div className="row-between">
            <h3>
              <Link to={`/vacancy/${application.vac_id}`}>{application.vacancy.vac_title}</Link>
            </h3>
            <StatusBadge map={APPLICATION_STATUS} status={application.status} />
          </div>
          <p className="muted">
            {application.company.comp_name} · {application.vacancy.vac_region || "регион не указан"} ·{" "}
            {formatSalary(application.vacancy.salary) || "зарплата не указана"}
          </p>
          <p className="muted">
            Отклик от {formatDate(application.app_created_at)}
            {application.status_changed_at && `, статус обновлён ${formatDate(application.status_changed_at)}`}
          </p>
          {application.status === "pending" && (
            <div style={{ marginTop: 10 }}>
              {confirmingId === application.app_id ? (
                <div className="stack">
                  <p className="muted">Отменить отклик на эту вакансию? Работодатель больше не увидит его в списке откликов.</p>
                  <div className="row">
                    <button
                      className="btn-danger"
                      disabled={busyId === application.app_id}
                      onClick={() => cancelApplication(application.app_id)}
                    >
                      {busyId === application.app_id ? "Отменяем…" : "Да, отменить"}
                    </button>
                    <button
                      disabled={busyId === application.app_id}
                      onClick={() => setConfirmingId(null)}
                    >
                      Не отменять
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn-small danger"
                  disabled={busyId !== null}
                  onClick={() => setConfirmingId(application.app_id)}
                >
                  Отменить отклик
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
