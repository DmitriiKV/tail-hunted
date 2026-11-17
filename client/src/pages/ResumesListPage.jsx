import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resumeService } from "../services/resumeService";
import SearchFilters from "../components/SearchFilters";

const initialFilters = {
  q: "",
  title: "",
  specialization: "",
  min_salary: "",
  max_salary: "",
  skills: "",
  education: "",
  experience: "",
};

const searchFields = [
  {
    name: "title",
    label: "Название резюме",
    placeholder: "Например, Python-разработчик",
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
    name: "max_salary",
    label: "Зарплата до (₽)",
    type: "number",
  },
  {
    name: "skills",
    label: "Навыки",
    placeholder: "Например, Python",
  },
  {
    name: "education",
    label: "Образование",
    placeholder: "Например, высшее",
  },
  {
    name: "experience",
    label: "Опыт работы",
    placeholder: "Например, 3 года",
  },
];

export default function ResumesListPage() {
  const [resumes, setResumes] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Загрузка резюме с фильтрами, сортировкой и пагинацией
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
          if (key === "min_salary" || key === "max_salary") {
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
        const data = await resumeService.listAll(params);

        if (active) {
          setResumes(data.items || []);
          setTotal(data.total || 0);
          setPages(data.pages || 0);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error || "Не удалось загрузить резюме"
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
      <h1>Резюме соискателей</h1>

      <SearchFilters
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        fields={searchFields}
        sort={sort}
        onSortChange={handleSortChange}
      />

      <h2>Результаты поиска</h2>

      {!loading && !error && (
        <p style={{ color: "#667085", fontSize: 14 }}>
          Найдено резюме: {total}
        </p>
      )}

      {loading && <p>Загрузка резюме...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && resumes.length === 0 && (
        <p style={{ textAlign: "center", color: "#667085" }}>
          По вашему запросу резюме не найдено.
        </p>
      )}

      {!error &&
        resumes.map((r) => (
          <div
            key={r.res_id}
            style={{
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: "0 0 6px" }}>{r.res_title}</h3>

            <p
              style={{
                margin: "0 0 4px",
                color: "#0000FF",
                fontWeight: 500,
              }}
            >
              {r.salary_expectation
                ? `${r.salary_expectation} ₽`
                : "з/п не указана"}
            </p>

            <p
              style={{
                margin: "0 0 6px",
                color: "#667085",
                fontSize: 14,
              }}
            >
              {r.professional_area || "область не указана"} ·{" "}
              {r.education || "образование не указано"}
            </p>

            {r.skills && (
              <p
                style={{
                  margin: "0 0 6px",
                  fontSize: 14,
                  color: "#475467",
                }}
              >
                <strong>Навыки:</strong> {r.skills}
              </p>
            )}

            {r.experience && (
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  color: "#475467",
                }}
              >
                {r.experience}
              </p>
            )}

            {/* Переход на подробную страницу резюме */}
            <div style={{ marginTop: 14 }}>
              <Link
                to={`/resume/${r.res_id}`}
                className="btn-primary"
              >
                Подробнее о кандидате
              </Link>
            </div>
          </div>
        ))}

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
        <Link to="/">← На главную</Link>
      </div>
    </div>
  );
}
