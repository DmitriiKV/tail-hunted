
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getVacancyApplications,
  updateApplicationStatus,
} from "../services/applicationService";

const statusLabels = {
  pending: "Ожидает рассмотрения",
  viewed: "Просмотрено",
  invited: "Приглашение",
  rejected: "Отказ",
};

export default function EmployerApplicationsPage() {
  const { id } = useParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    getVacancyApplications(id)
      .then((response) => {
        setApplications(response.data.applications || []);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Не удалось загрузить отклики"
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    setError("");

    try {
      await updateApplicationStatus(appId, newStatus);

      setApplications((prev) =>
        prev.map((application) =>
          application.app_id === appId
            ? { ...application, status: newStatus }
            : application
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error || "Не удалось изменить статус"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="auth-container">Загрузка...</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <h1>Отклики на вакансию</h1>

      {error && <p className="error">{error}</p>}

      {applications.length === 0 && !error && (
        <p style={{ textAlign: "center", color: "#667085" }}>
          На эту вакансию пока никто не откликнулся.
        </p>
      )}

      {applications.map((application) => {
        const resume = application.resume || {};

        return (
          <div key={application.app_id} className="vacancy-card">
            <div className="vacancy-card-body">
              <h3>{resume.res_title || "Резюме без названия"}</h3>

              <p style={{ margin: "0 0 6px", color: "#667085" }}>
                Профессиональная область:{" "}
                {resume.professional_area || "Не указана"}
              </p>

              <p style={{ margin: "0 0 10px" }}>
                Статус:{" "}
                <strong>
                  {statusLabels[application.status] || application.status}
                </strong>
              </p>

              <p style={{ margin: 0, fontSize: 13, color: "#667085" }}>
                Дата отклика:{" "}
                {application.app_created_at
                  ? new Date(application.app_created_at).toLocaleDateString(
                      "ru-RU"
                    )
                  : "Не указана"}
              </p>

              <div style={{ marginTop: 14 }}>
                <Link
                  to={`/application/${application.app_id}/resume`}
                  className="btn-small"
                >
                  Открыть резюме
                </Link>
              </div>

              <div style={{ marginTop: 14 }}>
                <label
                  htmlFor={`status-${application.app_id}`}
                  style={{ display: "block", marginBottom: 6 }}
                >
                  Изменить статус:
                </label>

                <select
                  id={`status-${application.app_id}`}
                  value={application.status}
                  disabled={updatingId === application.app_id}
                  onChange={(event) =>
                    handleStatusChange(
                      application.app_id,
                      event.target.value
                    )
                  }
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid #d0d5dd",
                    maxWidth: "100%",
                  }}
                >
                  <option value="pending">Ожидает рассмотрения</option>
                  <option value="viewed">Просмотрено</option>
                  <option value="invited">Приглашение</option>
                  <option value="rejected">Отказ</option>
                </select>

                {updatingId === application.app_id && (
                  <span style={{ marginLeft: 8, fontSize: 13 }}>
                    Сохранение...
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="auth-footer">
        <Link to="/my-vacancies">← К моим вакансиям</Link>
      </div>
    </div>
  );
}
