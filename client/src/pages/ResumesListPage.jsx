
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { vacancyService } from "../services/vacancyService";
import { matchingService } from "../services/matchingService";
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

const PER_PAGE = 10;

const getList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.vacancies)) return data.vacancies;
  if (Array.isArray(data?.resumes)) return data.resumes;
  return [];
};

const getResume = (item) => item?.resume || item;

const getSalary = (resume) => {
  const value = resume.salary_expectation;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : null;
};

const normalize = (value) =>
  String(value ?? "").toLowerCase().trim().replace(/ё/g, "е");

export default function ResumesListPage() {
  const [vacancies, setVacancies] = useState([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState("");

  const [resumes, setResumes] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [vacanciesLoading, setVacanciesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Загружаем вакансии текущего работодателя
  useEffect(() => {
    let active = true;

    const loadVacancies = async () => {
      setVacanciesLoading(true);

      try {
        const data = await vacancyService.getMy();

        if (!active) return;

        const list = getList(data);
        setVacancies(list);

        if (list.length > 0) {
          setSelectedVacancyId(
            String(list[0].vac_id ?? list[0].id)
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              "Не удалось загрузить ваши вакансии"
          );
        }
      } finally {
        if (active) {
          setVacanciesLoading(false);
        }
      }
    };

    loadVacancies();

    return () => {
      active = false;
    };
  }, []);

  // Загружаем рекомендации под выбранную вакансию
  useEffect(() => {
    let active = true;

    const loadResumes = async () => {
      if (!selectedVacancyId) {
        setResumes([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await matchingService.getRecommendedResumes(
          selectedVacancyId
        );

        if (active) {
          setResumes(getList(data).map(getResume));
        }
      } catch (err) {
        if (active) {
          setResumes([]);
          setError(
            err.response?.data?.error ||
              "Не удалось загрузить рекомендованные резюме"
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadResumes();

    return () => {
      active = false;
    };
  }, [selectedVacancyId]);

  // Фильтрация и сортировка рекомендаций
  const filteredResumes = useMemo(() => {
    const prepared = resumes
      .map((resume, index) => ({
        resume,
        originalIndex: index,
      }))
      .filter(({ resume }) => {
        const title = normalize(resume.res_title);
        const specialization = normalize(
          resume.professional_area || resume.specialization
        );
        const skills = normalize(resume.skills);
        const education = normalize(resume.education);
        const experience = normalize(
          `${resume.experience || ""} ${resume.experience_level || ""}`
        );

        const salary = getSalary(resume);

        const searchableText = normalize(
          [
            resume.res_title,
            resume.professional_area,
            resume.specialization,
            resume.skills,
            resume.education,
            resume.experience,
            resume.experience_level,
          ].join(" ")
        );

        if (
          filters.q &&
          !searchableText.includes(normalize(filters.q))
        ) {
          return false;
        }

        if (
          filters.title &&
          !title.includes(normalize(filters.title))
        ) {
          return false;
        }

        if (
          filters.specialization &&
          !specialization.includes(normalize(filters.specialization))
        ) {
          return false;
        }

        if (
          filters.skills &&
          !skills.includes(normalize(filters.skills))
        ) {
          return false;
        }

        if (
          filters.education &&
          !education.includes(normalize(filters.education))
        ) {
          return false;
        }

        if (
          filters.experience &&
          !experience.includes(normalize(filters.experience))
        ) {
          return false;
        }

        if (filters.min_salary) {
          const min = Number(filters.min_salary);

          if (salary === null || salary < min) return false;
        }

        if (filters.max_salary) {
          const max = Number(filters.max_salary);

          if (salary === null || salary > max) return false;
        }

        return true;
      });

    prepared.sort((a, b) => {
      const aResume = a.resume;
      const bResume = b.resume;

      if (sort === "salary_asc" || sort === "salary_desc") {
        const aSalary = getSalary(aResume);
        const bSalary = getSalary(bResume);

        if (aSalary === null && bSalary !== null) return 1;
        if (bSalary === null && aSalary !== null) return -1;

        if (aSalary !== bSalary) {
          return sort === "salary_asc"
            ? aSalary - bSalary
            : bSalary - aSalary;
        }
      }

      if (sort === "newest" || sort === "oldest") {
        const aDate = new Date(
          aResume.res_created_at ||
            aResume.created_at ||
            aResume.createdAt ||
            0
        ).getTime();

        const bDate = new Date(
          bResume.res_created_at ||
            bResume.created_at ||
            bResume.createdAt ||
            0
        ).getTime();

        const validA = Number.isFinite(aDate) && aDate > 0;
        const validB = Number.isFinite(bDate) && bDate > 0;

        if (validA && !validB) return -1;
        if (validB && !validA) return 1;

        if (validA && validB && aDate !== bDate) {
          return sort === "newest"
            ? bDate - aDate
            : aDate - bDate;
        }
      }

      // При равных значениях сохраняем порядок рекомендаций
      return a.originalIndex - b.originalIndex;
    });

    return prepared.map((item) => item.resume);
  }, [resumes, filters, sort]);

  // Пагинация после фильтрации и сортировки
  const pages = Math.ceil(filteredResumes.length / PER_PAGE);

  const paginatedResumes = filteredResumes.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  // Если после фильтрации страниц стало меньше
  useEffect(() => {
    if (pages > 0 && page > pages) {
      setPage(pages);
    }
  }, [pages, page]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ ...initialFilters });
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSort(value);
    setPage(1);
  };

  const handleVacancyChange = (event) => {
    setSelectedVacancyId(event.target.value);
    setPage(1);
  };

  const getPageNumbers = () => {
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  };

  const selectedVacancy = vacancies.find(
    (vacancy) =>
      String(vacancy.vac_id ?? vacancy.id) === selectedVacancyId
  );

  return (
    <div className="auth-container" style={{ maxWidth: 900 }}>
      <h1>Подходящие кандидаты</h1>

      <div style={{ marginBottom: 24 }}>
        <label
          htmlFor="vacancy-select"
          style={{
            display: "block",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Выберите вакансию для поиска кандидатов
        </label>

        {vacanciesLoading ? (
          <p>Загрузка ваших вакансий...</p>
        ) : vacancies.length === 0 ? (
          <p>
            У вас пока нет вакансий. Сначала создайте вакансию,
            чтобы увидеть подходящих кандидатов.
          </p>
        ) : (
          <select
            id="vacancy-select"
            value={selectedVacancyId}
            onChange={handleVacancyChange}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #d0d5dd",
              borderRadius: 8,
              fontSize: 15,
            }}
          >
            {vacancies.map((vacancy) => (
              <option
                key={vacancy.vac_id ?? vacancy.id}
                value={String(vacancy.vac_id ?? vacancy.id)}
              >
                {vacancy.vac_title ||
                  vacancy.title ||
                  `Вакансия №${vacancy.vac_id ?? vacancy.id}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedVacancy && (
        <>
          <p style={{ color: "#667085", fontSize: 14 }}>
            Рекомендации для вакансии:{" "}
            <strong>
              {selectedVacancy.vac_title || selectedVacancy.title}
            </strong>
          </p>

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
              Найдено резюме: {filteredResumes.length}
            </p>
          )}

          {loading && <p>Подбираем подходящих кандидатов...</p>}

          {error && <p className="error">{error}</p>}

          {!loading &&
            !error &&
            filteredResumes.length === 0 && (
              <p style={{ textAlign: "center", color: "#667085" }}>
                Подходящих резюме по вашему запросу не найдено.
              </p>
            )}

          {!loading &&
            !error &&
            paginatedResumes.map((r) => (
              <div
                key={r.res_id}
                style={{
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: "0 0 6px" }}>
                  {r.res_title}
                </h3>

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

                <div style={{ marginTop: 14 }}>
                  <Link
                    to={`/resume/${r.res_id}`}
                    state={{
                      fromRecommendations: true,
                      vacancyId: selectedVacancyId,
                    }}
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
                    fontWeight:
                      pageNumber === page ? "bold" : "normal",
                    background:
                      pageNumber === page ? "#e5e7eb" : undefined,
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
        </>
      )}

      <div className="auth-footer">
        <Link to="/">← На главную</Link>
      </div>
    </div>
  );
}
