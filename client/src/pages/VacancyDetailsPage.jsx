
import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

import { vacancyService } from "../services/vacancyService";
import {
  createApplication,
  getMyApplications,
} from "../services/applicationService";
import { matchingService } from "../services/matchingService";

export default function VacancyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const fromRecommendations =
    location.state?.fromRecommendations === true;

  const [vacancy, setVacancy] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [error, setError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");
  const [applyError, setApplyError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const response = await vacancyService.getById(id);

        if (active) {
          setVacancy(response);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              "Не удалось загрузить вакансию"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      try {
        const response = await getMyApplications();
        const applications = response.data.applications || [];

        if (active) {
          const hasApplication = applications.some(
            (application) =>
              Number(application.vac_id) === Number(id)
          );

          setAlreadyApplied(hasApplication);
        }
      } catch {
        if (active) {
          setApplicationsError(
            "Не удалось проверить ваши отклики. Отправка отклика временно недоступна."
          );
        }
      } finally {
        if (active) {
          setApplicationsLoading(false);
        }
      }

      // Получаем процент совпадения, только если пришли из ленты рекомендаций
      if (fromRecommendations) {
        try {
          const response =
            await matchingService.getVacancyMatchScore(id);

          if (active) {
            setMatchScore(response.score);
          }
        } catch {
          // Если оценку получить не удалось, просто не показываем её
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, [id, fromRecommendations]);

  const handleApply = async () => {
    setApplying(true);
    setApplyError("");
    setSuccess("");

    try {
      await createApplication(Number(id));
      setAlreadyApplied(true);
      setSuccess("Ваш отклик успешно отправлен!");
    } catch (err) {
      if (err.response?.status === 409) {
        setAlreadyApplied(true);
        setSuccess("Вы уже откликались на эту вакансию.");
      } else {
        setApplyError(
          err.response?.data?.error ||
            "Не удалось отправить отклик"
        );
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        Загрузка вакансии...
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <p className="error">{error}</p>
        <button onClick={() => navigate("/vacancies")}>
          ← К списку вакансий
        </button>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="auth-container">
        Вакансия не найдена.
      </div>
    );
  }

  const company = vacancy.company;

  return (
    <div className="auth-container" style={{ maxWidth: 800 }}>
      <h1>{vacancy.vac_title}</h1>

      {fromRecommendations && matchScore !== null && (
        <div
          style={{
            marginBottom: 20,
            padding: "12px 16px",
            background: "#eff8ff",
            borderRadius: 8,
            color: "#175cd3",
            fontWeight: 600,
          }}
        >
          Подходит вам на {Math.round(Number(matchScore))}%
        </div>
      )}

      <div className="vacancy-card">
        <div className="vacancy-card-body">
          <h2 style={{ color: "#0000FF" }}>
            {vacancy.salary
              ? `${vacancy.salary.toLocaleString("ru-RU")} ₽`
              : "Зарплата не указана"}
          </h2>

          <p>
            <strong>Регион:</strong>{" "}
            {vacancy.vac_region || "Не указан"}
          </p>

          <p>
            <strong>Специализация:</strong>{" "}
            {vacancy.specialization || "Не указана"}
          </p>

          <p>
            <strong>Опыт работы:</strong>{" "}
            {vacancy.experience_required || "Не указан"}
          </p>

          <p>
            <strong>Тип занятости:</strong>{" "}
            {vacancy.employment_type || "Не указан"}
          </p>

          <p>
            <strong>График работы:</strong>{" "}
            {vacancy.schedule || "Не указан"}
          </p>

          <p>
            <strong>Количество сотрудников:</strong>{" "}
            {vacancy.hiring_plan ?? "Не указано"}
          </p>

          <p>
            <strong>Необходимые навыки:</strong>
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {vacancy.skills_required || "Не указаны"}
          </p>

          <h3>Описание вакансии</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {vacancy.vac_description || "Описание отсутствует"}
          </p>

          <p style={{ color: "#667085", fontSize: 13 }}>
            Опубликована:{" "}
            {vacancy.vac_created_at
              ? new Date(vacancy.vac_created_at).toLocaleDateString(
                  "ru-RU"
                )
              : "Дата не указана"}
          </p>
        </div>
      </div>

      <h2>О компании</h2>

      {company ? (
        <div className="vacancy-card">
          <div className="vacancy-card-body">
            <h3>{company.comp_name}</h3>

            <p>
              <strong>Регион:</strong>{" "}
              {company.comp_region || "Не указан"}
            </p>

            <p>
              <strong>Адрес:</strong>{" "}
              {company.address || "Не указан"}
            </p>

            <p>
              <strong>Размер компании:</strong>{" "}
              {company.size || "Не указан"}
            </p>

            <h4>Описание компании</h4>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {company.comp_description || "Описание отсутствует"}
            </p>
          </div>
        </div>
      ) : (
        <p>Информация о компании отсутствует.</p>
      )}

      <div style={{ marginTop: 20 }}>
        {applicationsError && (
          <p className="error">{applicationsError}</p>
        )}

        {applyError && (
          <p className="error">{applyError}</p>
        )}

        {success && (
          <p style={{ color: "green" }}>{success}</p>
        )}

        {alreadyApplied ? (
          <button className="btn-small" disabled>
            Вы откликнулись
          </button>
        ) : (
          <button
            className="btn-small"
            onClick={handleApply}
            disabled={
              applying ||
              applicationsLoading ||
              !!applicationsError
            }
          >
            {applying
              ? "Отправка..."
              : applicationsLoading
              ? "Проверка откликов..."
              : "Откликнуться"}
          </button>
        )}
      </div>

      <div className="auth-footer">
        <Link to="/vacancies">← Вернуться к вакансиям</Link>
      </div>
    </div>
  );
}
