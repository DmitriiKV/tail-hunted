
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vacancyService } from "../services/vacancyService";
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

export default function VacanciesListPage() {
  const [vacancies, setVacancies] = useState([]);
  const [appliedVacancyIds, setAppliedVacancyIds] = useState(new Set());

  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [error, setError] = useState("");
  const [applicationsError, setApplicationsError] = useState("");

  // Загрузка вакансий с фильтрами, сортировкой и пагинацией
  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      const params = {
        page,
        per_page: 10,
        sort,
      };

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
        const data = await vacancyService.listAll(params);

        if (active) {
          setVacancies(data.items || []);
          setTotal(data.total || 0);
          setPages(data.pages || 0);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error || "Не удалось загрузить вакансии"
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
  }, [filters, sort, page]);

  // Загружаем информацию об откликах один раз
  useEffect(() => {
    getMyApplications()
      .then((response) => {
        const applications = response.data.applications || [];

        setAppliedVacancyIds(
          new Set(applications.map((application) => application.vac_id))
        );
      })
      .catch(() => {
        setApplicationsError(
          "Не удалось загрузить информацию о ваших откликах"
        );
      });
  }, []);

  // Изменение фильтров
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPage(1);
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setFilters({ ...initialFilters });
    setPage(1);
  };

  // Изменение сортировки
  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  // Отправка отклика
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

  // Номера страниц рядом с текущей
  const getPageNumbers = () => {
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  };

  return (
    <div className="auth-container" style={{ maxWidth: 900 }}>
      <h1>Вакансии</h1>

      <SearchFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        fields={searchFields}
        sort={sort}
        onSortChange={handleSortChange}
      />

      {applicationsError && (
        <p className="error">{applicationsError}</p>
      )}

      <h2>Результаты поиска</h2>

      {!loading && !error && (
        <p style={{ color: "#667085", fontSize: 14 }}>
          Найдено вакансий: {total}
        </p>
      )}

      {loading && <p>Загрузка вакансий...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && vacancies.length === 0 && (
        <p>По вашему запросу вакансий не найдено.</p>
      )}

      {!error &&
        vacancies.map((v) => {
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
                    disabled={
                      applyingId === v.vac_id || applicationsError !== ""
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

      {!loading && !error && pages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 24,
          }}
        >
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            ← Назад
          </button>

          {getPageNumbers().map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              disabled={pageNumber === page}
              style={{
                fontWeight: pageNumber === page ? "bold" : "normal",
                background: pageNumber === page ? "#e5e7eb" : undefined,
              }}
            >
              {pageNumber}
            </button>
          ))}

          <button
            type="button"
            disabled={page === pages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Вперёд →
          </button>
        </div>
      )}

      <div className="auth-footer">
        <Link to="/my-applications">Мои отклики</Link>
        <br />
        <Link to="/">← На главную</Link>
      </div>
    </div>
  );
}
