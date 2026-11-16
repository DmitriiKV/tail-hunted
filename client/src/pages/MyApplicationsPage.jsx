
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyApplications } from "../services/applicationService";

const statusLabels = {
  pending: "Ожидает рассмотрения",
  viewed: "Просмотрено",
  invited: "Приглашение",
  rejected: "Отказ",
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getMyApplications()
      .then((response) => {
        setApplications(response.data.applications || []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Не удалось загрузить отклики"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="auth-container">Загрузка...</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <h1>Мои отклики</h1>

      {error && <p className="error">{error}</p>}

      {!error && applications.length === 0 && (
        <p style={{ textAlign: "center", color: "#667085" }}>
          Вы пока не откликались на вакансии.
        </p>
      )}

      {applications.map((application) => (
        <div key={application.app_id} className="vacancy-card">
          <div className="vacancy-card-body">
            <h3>
              {application.vacancy?.vac_title || "Вакансия"}
            </h3>

            <p style={{ margin: "0 0 4px", color: "#667085" }}>
              Компания: {application.company?.comp_name || "Не указана"}
            </p>

            <p style={{ margin: "0 0 4px", color: "#667085" }}>
              Регион: {application.vacancy?.vac_region || "Не указан"}
            </p>

            <p style={{ margin: "8px 0 4px" }}>
              Статус: <strong>
                {statusLabels[application.status] || application.status}
              </strong>
            </p>

            <p style={{ margin: 0, fontSize: 13, color: "#667085" }}>
              Дата отклика:{" "}
              {application.app_created_at
                ? new Date(application.app_created_at).toLocaleDateString("ru-RU")
                : "Не указана"}
            </p>
          </div>
        </div>
      ))}

      <div className="auth-footer">
        <Link to="/vacancies">Посмотреть вакансии</Link>
        <br />
        <Link to="/" style={{ marginTop: 8, display: "inline-block" }}>
          ← На главную
        </Link>
      </div>
    </div>
  );
}
