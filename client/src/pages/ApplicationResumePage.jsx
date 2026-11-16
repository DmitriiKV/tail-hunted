
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApplicationResume } from "../services/applicationService";

export default function ApplicationResumePage() {
  const { appId } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getApplicationResume(appId)
      .then((response) => {
        setResume(response.data.resume);
      })
      .catch((err) => {
        setError(
          err.response?.data?.error || "Не удалось загрузить резюме"
        );
      })
      .finally(() => setLoading(false));
  }, [appId]);

  if (loading) {
    return <div className="auth-container">Загрузка резюме...</div>;
  }

  if (error) {
    return (
      <div className="auth-container">
        <p className="error">{error}</p>
        <button onClick={() => navigate(-1)}>Назад</button>
      </div>
    );
  }

  if (!resume) {
    return <div className="auth-container">Резюме не найдено</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <h1>{resume.res_title || "Резюме без названия"}</h1>

      <div className="vacancy-card">
        <div className="vacancy-card-body">
          <p>
            <strong>Профессиональная область:</strong>{" "}
            {resume.professional_area || "Не указана"}
          </p>

          <p>
            <strong>Пол:</strong>{" "}
            {resume.gender === "male"
              ? "Мужской"
              : resume.gender === "female"
              ? "Женский"
              : "Не указан"}
          </p>

          <p>
            <strong>Дата рождения:</strong>{" "}
            {resume.birth_date
              ? new Date(resume.birth_date).toLocaleDateString("ru-RU")
              : "Не указана"}
          </p>

          <p>
            <strong>Желаемая зарплата:</strong>{" "}
            {resume.salary_expectation
              ? `${resume.salary_expectation} ₽`
              : "Не указана"}
          </p>

          <p>
            <strong>Образование:</strong>{" "}
            {resume.education || "Не указано"}
          </p>

          <p>
            <strong>Навыки:</strong>{" "}
            {resume.skills || "Не указаны"}
          </p>

          <p>
            <strong>Опыт работы:</strong>{" "}
            {resume.experience || "Не указан"}
          </p>
        </div>
      </div>

      <div className="auth-footer">
        <button onClick={() => navigate(-1)}>
          ← Назад к откликам
        </button>
      </div>
    </div>
  );
}
