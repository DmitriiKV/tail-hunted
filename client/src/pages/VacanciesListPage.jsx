
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { matchingService } from "../services/matchingService";
import SearchFilters from "../components/SearchFilters";

import {
  getMyApplications,
  createApplication,
} from "../services/applicationService";

const initialFilters = {
  q: "",
  region: "",
  specialization: "",
  min_salary: "",
  employment_type: "",
  schedule: "",
  experience: "",
  skills: "",
};

const searchFields = [
  {
    name: "q",
    label: "Поиск",
    placeholder: "Название вакансии или ключевые слова",
  },
  {
    name: "region",
    label: "Регион",
    placeholder: "Например, Москва",
  },
  {
    name: "specialization",
    label: "Специализация",
    placeholder: "Например, разработка",
  },
  {
    name: "min_salary",
    label: "Зарплата от (₽)",
    type: "number",
  },
  {
    name: "employment_type",
    label: "Тип занятости",
    type: "select",
    options: [
      { value: "full", label: "Полная занятость" },
      { value: "part", label: "Частичная занятость" },
      { value: "project", label: "Проектная работа" },
      { value: "internship", label: "Стажировка" },
    ],
  },
  {
    name: "schedule",
    label: "График работы",
    placeholder: "Например, удалённо",
  },
  {
    name: "experience",
    label: "Опыт работы",
    placeholder: "Например, без опыта",
  },
  {
    name: "skills",
    label: "Навыки",
    placeholder: "Например, Python",
  },
];

// Преобразуем зарплату в число
const getSalaryValue = (salary) => {
  if (salary === null || salary === undefined || salary === "") {
    return null;
  }

  const value = Number(
    String(salary).replace(/[^\d.-]/g, "")
  );

  return Number.isFinite(value) ? value : null;
};

// Преобразуем дату в число
const getDateValue = (date) => {
  if (!date) {
    return null;
  }

  const value = new Date(date).getTime();

  return Number.isFinite(value) ? value : null;
};

// Сортировка с сохранением рекомендованного порядка при равных значениях
const sortVacancies = (vacancies, sortType) => {
  return vacancies
    .map((vacancy, index) => ({
      vacancy,
      originalIndex: index,
    }))
    .sort((a, b) => {
      let valueA;
      let valueB;
      let direction = 1;

      switch (sortType) {
        case "oldest":
          valueA = getDateValue(a.vacancy.vac_created_at);
          valueB = getDateValue(b.vacancy.vac_created_at);
          direction = 1;
          break;

        case "salary_asc":
          valueA = getSalaryValue(a.vacancy.salary);
          valueB = getSalaryValue(b.vacancy.salary);
          direction = 1;
          break;

        case "salary_desc":
          valueA = getSalaryValue(a.vacancy.salary);
          valueB = getSalaryValue(b.vacancy.salary);
          direction = -1;
          break;

        case "newest":
        default:
          valueA = getDateValue(a.vacancy.vac_created_at);
          valueB = getDateValue(b.vacancy.vac_created_at);
          direction = -1;
          break;
      }

      // Вакансии без даты или зарплаты отправляем в конец
      if (valueA === null && valueB !== null) {
        return 1;
      }

      if (valueA !== null && valueB === null) {
        return -1;
      }

      // Если значения одинаковые, сохраняем порядок рекомендаций
      if (valueA === valueB) {
        return a.originalIndex - b.originalIndex;
      }

      return (valueA - valueB) * direction;
    })
    .map((item) => item.vacancy);
};

export default function VacanciesListPage() {
  const [vacancies, setVacancies] = useState([]);
  const [appliedVacancyIds, setAppliedVacancyIds] = useState(
    new Set()
  );

  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("newest");

  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);

  const [error, setError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");

  // Загружаем рекомендованную ленту с поиском и фильтрами
  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      const params = {};

      Object.entries(filters).forEach(([key, value]) => {
        if (value.trim() !== "") {
          if (key === "min_salary") {
            const number = Number(value);

            if (Number.isFinite(number)) {
              params[key] = number;
            }
          } else {
            params[key] = value.trim();
          }
        }
      });

      setLoading(true);
      setError("");

      try {
        const data =
          await matchingService.getRecommendedVacancies(params);

        if (active) {
          setVacancies(
            Array.isArray(data)
              ? data.map((item) => item.vacancy)
              : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              "Не удалось загрузить рекомендации"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters]);

  // Загружаем информацию об откликах
  useEffect(() => {
    let active = true;

    getMyApplications()
      .then((response) => {
        if (!active) return;

        const applications =
          response.data.applications || [];

        setAppliedVacancyIds(
          new Set(
            applications.map(
              (application) => Number(application.vac_id)
            )
          )
        );
      })
      .catch(() => {
        if (active) {
          setApplicationsError(
            "Не удалось загрузить информацию о ваших откликах"
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Изменение фильтров
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setFilters({ ...initialFilters });
  };

  // Отправка отклика
  const handleApply = async (vacancyId) => {
    setApplyingId(vacancyId);

    try {
      await createApplication(vacancyId);

      setAppliedVacancyIds((prev) => {
        const updated = new Set(prev);
        updated.add(Number(vacancyId));
        return updated;
      });
    } catch (err) {
      if (err.response?.status === 409) {
        setAppliedVacancyIds(
          (prev) => new Set([...prev, Number(vacancyId)])
        );
      } else {
        alert(
          err.response?.data?.error ||
            "Не удалось отправить отклик"
        );
      }
    } finally {
      setApplyingId(null);
    }
  };

  // Применяем выбранную сортировку к рекомендованной ленте
  const sortedVacancies = sortVacancies(vacancies, sort);

  return (
    <div className="auth-container" style={{ maxWidth: 900 }}>
      <h1>Вакансии для вас</h1>

      <SearchFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        fields={searchFields}
        sort={sort}
        onSortChange={setSort}
      />

      {applicationsError && (
        <p className="error">{applicationsError}</p>
      )}

      {!loading && !error && (
        <p style={{ color: "#667085", fontSize: 14 }}>
          Найдено вакансий: {sortedVacancies.length}
        </p>
      )}

      {loading && <p>Подбираем вакансии...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && sortedVacancies.length === 0 && (
        <p>
          Подходящих вакансий не найдено. Попробуйте изменить
          параметры поиска или заполнить резюме подробнее.
        </p>
      )}

      {!error &&
        sortedVacancies.map((v) => {
          const alreadyApplied = appliedVacancyIds.has(
            Number(v.vac_id)
          );

          return (
            <div
              key={v.vac_id}
              style={{
                padding: 16,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                marginBottom: 12,
                background: "#fff",
              }}
            >
              <h3 style={{ margin: "0 0 6px" }}>
                {v.vac_title}
              </h3>

              <Link
                to={`/vacancy/${v.vac_id}`}
                state={{ fromRecommendations: true }}
                style={{
                  display: "inline-block",
                  marginBottom: 10,
                  color: "#2563eb",
                  fontSize: 14,
                }}
              >
                Подробнее →
              </Link>

              <p
                style={{
                  margin: "0 0 6px",
                  color: "#0000FF",
                  fontWeight: 500,
                }}
              >
                {v.salary
                  ? `${v.salary} ₽`
                  : "з/п не указана"}
              </p>

              <p
                style={{
                  margin: "0 0 6px",
                  color: "#667085",
                  fontSize: 14,
                }}
              >
                {v.vac_region || "Регион не указан"} ·{" "}
                {v.experience_required || "опыт не указан"} ·{" "}
                {v.employment_type || "тип занятости не указан"}
              </p>

              {v.comp_name && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {v.comp_name}
                </p>
              )}

              {v.skills_required && (
                <p style={{ margin: "0 0 6px", fontSize: 14 }}>
                  {v.skills_required}
                </p>
              )}

              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#475467",
                }}
              >
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
                    disabled={
                      applyingId === v.vac_id ||
                      applicationsError !== ""
                    }
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
