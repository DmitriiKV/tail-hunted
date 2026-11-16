
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vacancyService } from "../services/vacancyService";
import {
  getMyApplications,
  createApplication,
} from "../services/applicationService";

export default function VacanciesListPage() {
  const [vacancies, setVacancies] = useState([]);
  const [appliedVacancyIds, setAppliedVacancyIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");

  useEffect(() => {
    vacancyService
      .listAll()
      .then(setVacancies)
      .catch((err) => {
        setError(err.response?.data?.error || "Не удалось загрузить вакансии");
      })
      .finally(() => setLoading(false));

    getMyApplications()
      .then((response) => {
        const applications = response.data.applications || [];

        setAppliedVacancyIds(
          new Set(applications.map((application) => application.vac_id))
        );
      })
      .catch(() => {
        setApplicationsError("Не удалось загрузить информацию о ваших откликах");
      });
  }, []);

  const handleApply = async (vacancyId) => {
    setApplyingId(vacancyId);

    try {
      await createApplication(vacancyId);

      setAppliedVacancyIds((prev) => {
        const updated = new Set(prev);
        updated.add(vacancyId);
        return updated;
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setAppliedVacancyIds((prev) => new Set([...prev, vacancyId]));
      } else {
        alert(err.response?.data?.error || "Не удалось отправить отклик");
      }
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) {
    return <div className="auth-container">Загрузка...</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <h1>Вакансии</h1>

      {error && <p className="error">{error}</p>}

      {applicationsError && (
        <p className="error">{applicationsError}</p>
      )}

      {vacancies.length === 0 && !error && (
        <p>Пока нет вакансий.</p>
      )}

      {vacancies.map((v) => {
        const alreadyApplied = appliedVacancyIds.has(v.vac_id);

        return (
          <div
            key={v.vac_id}
            style={{
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: "0 0 6px" }}>{v.vac_title}</h3>

            <p
              style={{
                margin: "0 0 6px",
                color: "#0000FF",
                fontWeight: 500,
              }}
            >
              {v.salary ? `${v.salary} ₽` : "з/п не указана"}
            </p>

            <p
              style={{
                margin: "0 0 6px",
                color: "#667085",
                fontSize: 14,
              }}
            >
              {v.vac_region} · {v.experience_required || "опыт не указан"} ·{" "}
              {v.employment_type}
            </p>

            <p style={{ margin: "0 0 6px", fontSize: 14 }}>
              {v.skills_required}
            </p>

            <p style={{ margin: 0, fontSize: 14, color: "#475467" }}>
              {v.vac_description}
            </p>

            <div style={{ marginTop: 14 }}>
              {alreadyApplied ? (
                <button className="btn-small" disabled>
                  Вы откликнулись
                </button>
              ) : (
                <button
                  className="btn-small"
                  onClick={() => handleApply(v.vac_id)}
                  disabled={applyingId === v.vac_id || applicationsError !== ""}
                >
                  {applyingId === v.vac_id
                    ? "Отправка..."
                    : "Откликнуться"}
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="auth-footer">
        <Link to="/my-applications">Мои отклики</Link>
        <br />
        <Link to="/">← На главную</Link>
      </div>
    </div>
  );
}
