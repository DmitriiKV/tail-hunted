import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resumeService } from "../services/resumeService";

export default function ResumeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const loadResume = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await resumeService.getById(id);
      setResume(data);
    } catch (err) {
      setError(
        err.response?.data?.error || "Не удалось загрузить резюме"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResume();
  }, [id]);

  const handleRequestContacts = async () => {
    try {
      setRequestLoading(true);
      setRequestMessage("");

      const response = await resumeService.requestContacts(id);

      setRequestMessage(
        response.message || "Запрос отправлен кандидату"
      );
    } catch (err) {
      setRequestMessage(
        err.response?.data?.error || "Не удалось отправить запрос"
      );
    } finally {
      setRequestLoading(false);
    }
  };

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

  if (!resume) return null;

  return (
    <div className="auth-container" style={{ maxWidth: 900 }}>
      <h1>{resume.res_title}</h1>

      <div className="vacancy-card">
        <div className="vacancy-card-body">
          <h2>Основная информация</h2>

          <p>
            <strong>Специализация:</strong>{" "}
            {resume.professional_area || "Не указана"}
          </p>

          <p>
            <strong>Зарплатные ожидания:</strong>{" "}
            {resume.salary_expectation
              ? `${resume.salary_expectation} ₽`
              : "Не указаны"}
          </p>

          <p>
            <strong>Пол:</strong> {resume.gender || "Не указан"}
          </p>

          <p>
            <strong>Дата рождения:</strong>{" "}
            {resume.birth_date || "Не указана"}
          </p>

          <h2>Образование</h2>
          <p>{resume.education || "Не указано"}</p>

          <h2>Навыки</h2>
          <p>{resume.skills || "Не указаны"}</p>

          <h2>Опыт работы</h2>
          <p>{resume.experience || "Не указан"}</p>

          <hr />

          <h2>Контактные данные</h2>

          {resume.contact_email ? (
            <p>
              <strong>Email кандидата:</strong>{" "}
              <a href={`mailto:${resume.contact_email}`}>
                {resume.contact_email}
              </a>
            </p>
          ) : (
            <>
              <p>
                Кандидат пока не предоставил доступ к контактным данным.
              </p>

              <button
                onClick={handleRequestContacts}
                disabled={requestLoading}
                className="btn-primary"
              >
                {requestLoading
                  ? "Отправка..."
                  : "Запросить контакты"}
              </button>

              {requestMessage && (
                <p style={{ marginTop: 10 }}>
                  {requestMessage}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="auth-footer">
        <Link to="/resumes">← К списку резюме</Link>
      </div>
    </div>
  );
}