
import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { resumeService } from "../services/resumeService";
import { matchingService } from "../services/matchingService";

export default function ResumeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const vacancyId = location.state?.vacancyId;
  const fromRecommendations =
    location.state?.fromRecommendations === true && !!vacancyId;

  const [resume, setResume] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await resumeService.getById(id);

        if (active) {
          setResume(data);
        }

        if (fromRecommendations) {
          setScoreLoading(true);

          try {
            const scoreData =
              await matchingService.getResumeMatchScore(
                id,
                vacancyId
              );

            if (active) {
              setMatchScore(scoreData.score);
            }
          } catch (err) {
            console.error(
              "Не удалось загрузить процент совпадения:",
              err
            );
          } finally {
            if (active) {
              setScoreLoading(false);
            }
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              "Не удалось загрузить резюме"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id, vacancyId, fromRecommendations]);

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
        err.response?.data?.error ||
          "Не удалось отправить запрос"
      );
    } finally {
      setRequestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        Загрузка резюме...
      </div>
    );
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

      {fromRecommendations && (
        <div
          style={{
            padding: 16,
            marginBottom: 20,
            border: "1px solid #d1e7dd",
            background: "#f0fdf4",
            borderRadius: 10,
          }}
        >

          {scoreLoading ? (
            <p style={{ marginBottom: 0 }}>
              Рассчитываем совпадение...
            </p>
          ) : matchScore !== null ? (
            <p
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#15803d",
                margin: "8px 0 0",
              }}
            >
              Подходит вам на {matchScore}%
            </p>
          ) : (
            <p style={{ marginBottom: 0 }}>
              Не удалось рассчитать процент совпадения.
            </p>
          )}
        </div>
      )}

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
        <Link to="/resumes">← К списку кандидатов</Link>
      </div>
    </div>
  );
}
