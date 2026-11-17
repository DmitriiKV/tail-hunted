
import { useState } from "react";

export default function SearchFilters({
  filters,
  onChange,
  onReset,
  fields,
  sort,
  onSortChange,
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    boxSizing: "border-box",
    fontSize: 14,
  };

  const fieldStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => key !== "q" && value !== ""
  ).length;

  const sortOptions = [
    { value: "newest", label: "Сначала новые" },
    { value: "oldest", label: "Сначала старые" },
    { value: "salary_asc", label: "Зарплата: по возрастанию" },
    { value: "salary_desc", label: "Зарплата: по убыванию" },
  ];

  const toggleButtonStyle = {
    padding: "10px 16px",
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  };

  const showSort =
    sort !== undefined && typeof onSortChange === "function";

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Общее поле поиска с иконкой */}
      <div style={{ marginBottom: 12, position: "relative" }}>
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#667085"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          id="general-search"
          name="q"
          type="text"
          value={filters.q || ""}
          onChange={onChange}
          placeholder="Название, профессия, навыки и описание..."
          aria-label="Поиск вакансий"
          style={{
            ...inputStyle,
            paddingLeft: 42,
          }}
        />
      </div>

      {/* Кнопки фильтров и сортировки */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          onClick={() => {
            setFiltersOpen((prev) => !prev);
            setSortOpen(false);
          }}
          style={toggleButtonStyle}
        >
          ☷ Фильтры
          {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          {filtersOpen ? " ▲" : " ▼"}
        </button>

        {showSort && (
          <button
            type="button"
            onClick={() => {
              setSortOpen((prev) => !prev);
              setFiltersOpen(false);
            }}
            style={toggleButtonStyle}
          >
            ↕ Сортировка
            {sortOpen ? " ▲" : " ▼"}
          </button>
        )}
      </div>

      {/* Дополнительные фильтры */}
      {filtersOpen && (
        <div
          style={{
            padding: 18,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            marginBottom: 12,
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            Дополнительные фильтры
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            {fields
              .filter((field) => field.name !== "q")
              .map((field) => (
                <div
                  key={field.name}
                  style={{
                    ...fieldStyle,
                    gridColumn: field.fullWidth
                      ? "1 / -1"
                      : undefined,
                  }}
                >
                  <label htmlFor={field.name}>
                    {field.label}
                  </label>

                  {field.type === "select" ? (
                    <select
                      id={field.name}
                      name={field.name}
                      value={filters[field.name] || ""}
                      onChange={onChange}
                      style={inputStyle}
                    >
                      <option value="">Любой</option>

                      {field.options.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type || "text"}
                      min={
                        field.type === "number" ? 0 : undefined
                      }
                      value={filters[field.name] || ""}
                      onChange={onChange}
                      placeholder={field.placeholder || ""}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
          </div>

          <button
            type="button"
            onClick={onReset}
            style={{ marginTop: 16 }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}

      {/* Сортировка — если она подключена */}
      {showSort && sortOpen && (
        <div
          style={{
            padding: 18,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            marginBottom: 12,
            maxWidth: 350,
          }}
        >
          <label
            htmlFor="sort-select"
            style={{
              display: "block",
              marginBottom: 8,
            }}
          >
            Сортировать:
          </label>

          <select
            id="sort-select"
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value)
            }
            style={inputStyle}
          >
            {sortOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
