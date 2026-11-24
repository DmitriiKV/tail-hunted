import { useState } from "react";
import { experienceFilterLabel } from "../utils/experience";

const SORT_OPTIONS = [
  { value: "match", label: "По совпадению" },
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "salary_asc", label: "Зарплата по возрастанию" },
  { value: "salary_desc", label: "Зарплата по убыванию" },
];

const optionLabel = (field, value) => {
  if (field.type === "select") {
    return field.options.find((o) => o.value === value)?.label || value;
  }
  if (field.type === "experience") return experienceFilterLabel(value);
  return value;
};

const isActive = (field, value) =>
  field.type === "experience" ? Boolean(value?.type) : value !== "" && value != null;

export default function SearchFilters({
  filters,
  fields,
  onChange,
  onReset,
  sort,
  onSortChange,
  searchPlaceholder = "Поиск",
}) {
  const [open, setOpen] = useState(false);

  const extra = fields.filter((field) => field.name !== "q");
  const active = extra.filter((field) => isActive(field, filters[field.name]));
  const clear = (name) =>
    onChange({
      target: {
        name,
        value: name === "experience" ? { type: "", min: "", max: "", more: "" } : "",
      },
    });

  const updateExperience = (key, value) => {
    const next = { ...(filters.experience || {}), [key]: value };
    if (key === "type" && value === "range") {
      next.min = next.min || "0";
      next.max = next.max || "50";
    }
    if (key === "type" && value === "more") {
      next.more = next.more || "0";
    }
    onChange({ target: { name: "experience", value: next } });
  };

  return (
    <div>
      <div className="search-bar">
        <input
          name="q"
          type="search"
          value={filters.q || ""}
          onChange={onChange}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
        />
        {onSortChange && (
          <select value={sort} onChange={(e) => onSortChange(e.target.value)} aria-label="Сортировка">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        <button type="button" onClick={() => setOpen(!open)}>
          Фильтры{active.length > 0 && ` · ${active.length}`}
        </button>
      </div>

      {active.length > 0 && (
        <div className="chips" style={{ marginBottom: 10 }}>
          {active.map((field) => (
            <span key={field.name} className="chip">
              {field.label}: {optionLabel(field, filters[field.name])}
              <button type="button" className="chip-remove" onClick={() => clear(field.name)} aria-label="Убрать фильтр">
                ×
              </button>
            </span>
          ))}
          <button type="button" className="btn-small" onClick={onReset}>Сбросить всё</button>
        </div>
      )}

      {open && (
        <div className="filter-panel">
          <div className="filter-grid">
            {extra.map((field) => (
              <div key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                {field.type === "select" ? (
                  <select id={field.name} name={field.name} value={filters[field.name] || ""} onChange={onChange}>
                    <option value="">Не важно</option>
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : field.type === "experience" ? (
                  <>
                    <select
                      id={field.name}
                      value={filters.experience?.type || ""}
                      onChange={(e) => updateExperience("type", e.target.value)}
                    >
                      <option value="">Не важно</option>
                      <option value="none">Без опыта</option>
                      <option value="range">Диапазон лет</option>
                      <option value="more">Более N лет</option>
                    </select>
                    {filters.experience?.type === "range" && (
                      <div className="row" style={{ gap: 8, marginTop: 8 }}>
                        <input aria-label="Опыт от, лет" type="number" min="0" max="49" placeholder="От"
                          value={filters.experience.min || ""} onChange={(e) => updateExperience("min", e.target.value)} />
                        <input aria-label="Опыт до, лет" type="number" min="1" max="50" placeholder="До"
                          value={filters.experience.max || ""} onChange={(e) => updateExperience("max", e.target.value)} />
                      </div>
                    )}
                    {filters.experience?.type === "more" && (
                      <input aria-label="Более скольких лет" type="number" min="0" max="50" placeholder="Лет"
                        value={filters.experience.more || ""} onChange={(e) => updateExperience("more", e.target.value)} />
                    )}
                  </>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type || "text"}
                    min={field.type === "number" ? 0 : undefined}
                    value={filters[field.name] || ""}
                    onChange={onChange}
                    placeholder={field.placeholder || ""}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
