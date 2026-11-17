
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "../services/applicationService";

const statusLabels = {
  pending: "Ожидает рассмотрения",
  viewed: "Просмотрено",
  invited: "Приглашение",
  rejected: "Отказ",
};

const statusColors = {
  pending: { background: "#fff3cd", color: "#856404" },
  viewed: { background: "#eaf2ff", color: "#2457a7" },
  invited: { background: "#d1e7dd", color: "#0f5132" },
  rejected: { background: "#f8d7da", color: "#842029" },
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMyApplications();

      const items = response.data.applications || [];

      // Сначала показываем самые новые отклики
      items.sort(
        (a, b) =>
          new Date(b.app_created_at) - new Date(a.app_created_at)
      );

      setApplications(items);
    } catch (err) {
      setError(
        err.response?.data?.error || "Не удалось загрузить отклики"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const invitedCount = applications.filter(
    (item) => item.status === "invited"
  ).length;

  const pendingCount = applications.filter(
    (item) => item.status === "pending"
  ).length;

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>Мои отклики</h1>

        <button
          type="button"
          className="btn-secondary"
          onClick={loadApplications}
          disabled={loading}
        >
          {loading ? "Загрузка..." : "Обновить"}
        </button>
      </div>

      {!error && (
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            margin: "20px 0",
          }}
        >
          <div className="vacancy-card" style={{ flex: 1, minWidth: 140 }}>
            <div className="vacancy-card-body">
              <p style={{ color: "#667085", margin: 0 }}>
                Всего откликов
              </p>
              <h2 style={{ margin: "8px 0 0" }}>
                {applications.length}
              </h2>
            </div>
          </div>

          <div className="vacancy-card" style={{ flex: 1, minWidth: 140 }}>
            <div className="vacancy-card-body">
              <p style={{ color: "#667085", margin: 0 }}>
                Ожидают ответа
              </p>
              <h2 style={{ margin: "8px 0 0" }}>
                {pendingCount}
              </h2>
            </div>
          </div>

          <div className="vacancy-card" style={{ flex: 1, minWidth: 140 }}>
            <div className="vacancy-card-body">
              <p style={{ color: "#667085", margin: 0 }}>
                Приглашения
              </p>
              <h2 style={{ margin: "8px 0 0" }}>
                {invitedCount}
              </h2>
            </div>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {loading && applications.length === 0 && !error && (
        <p>Загрузка откликов...</p>
      )}

      {!loading && !error && applications.length === 0 && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ color: "#667085" }}>
            Вы пока не откликались на вакансии.
          </p>
          <Link to="/vacancies" className="btn-small">
            Посмотреть вакансии
          </Link>
        </div>
      )}

      {applications.map((application) => {
        const statusStyle =
          statusColors[application.status] || statusColors.pending;

        return (
          <div
            key={application.app_id}
            className="vacancy-card"
            style={{ marginTop: 16 }}
          >
            <div className="vacancy-card-body">
              <h3>
                {application.vacancy?.vac_title || "Вакансия"}
              </h3>

              <p style={{ color: "#667085" }}>
                Компания:{" "}
                {application.company?.comp_name || "Не указана"}
              </p>

              <p style={{ color: "#667085" }}>
                Регион:{" "}
                {application.vacancy?.vac_region || "Не указан"}
              </p>

              <p>
                Статус:{" "}
                <span
                  style={{
                    ...statusStyle,
                    display: "inline-block",
                    padding: "5px 10px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {statusLabels[application.status] || application.status}
                </span>
              </p>

              <p style={{ fontSize: 13, color: "#667085" }}>
                Дата отклика:{" "}
                {application.app_created_at
                  ? new Date(
                      application.app_created_at
                    ).toLocaleDateString("ru-RU")
                  : "Не указана"}
              </p>

              <Link
                to={`/vacancy/${application.vac_id}`}
                className="btn-small"
              >
                Открыть вакансию
              </Link>
            </div>
          </div>
        );
      })}

      <div className="auth-footer">
        <Link to="/vacancies">Посмотреть вакансии</Link>
        <br />
        <Link
          to="/"
          style={{ marginTop: 8, display: "inline-block" }}
        >
          ← На главную
        </Link>
      </div>
    </div>
  );
}
