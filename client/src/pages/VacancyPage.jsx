
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vacancyService } from "../services/vacancyService";
import { REGIONS } from "../constants/regions";
import { buildExperienceLevel, parseExperienceLevel } from "../utils/experience";
import { VACANCY_SCHEDULE_OPTIONS } from "../constants/schedules";

export default function VacancyPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    vac_title: "",
    specialization: "",
    hiring_plan: "",
    employment_type: "full",
    schedule: "",
    salary: "",
    experience_required: "",
    skills_required: "",
    vac_description: "",
    vac_region: "",
  });

  const [experienceSelection, setExperienceSelection] = useState({
    type: "",
    min: "1",
    max: "3",
    more: "5",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isEdit) return;

    vacancyService
      .getById(id)
      .then((v) => {
        setForm({
          ...v,
          hiring_plan: v.hiring_plan ?? "",
          salary: v.salary ?? "",
          vac_region: v.vac_region || "",
        });

        setExperienceSelection(
          parseExperienceLevel(v.experience_required)
        );
      })
      .catch((err) =>
        setError(err.response?.data?.error || "Не удалось загрузить вакансию")
      )
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleExperienceChange = (e) => {
    setExperienceSelection({
      ...experienceSelection,
      [e.target.name]: e.target.value,
    });
  };

  const validate = () => {
    if (!form.vac_region) {
      return "Выберите регион работы";
    }

    if (form.hiring_plan) {
      const n = Number(form.hiring_plan);

      if (!Number.isInteger(n) || n < 1 || n > 10000) {
        return "План найма должен быть целым числом от 1 до 10 000";
      }
    }

    if (form.salary === "" || form.salary == null) {
      return "Укажите зарплату в вакансии";
    }

    if (form.salary !== "") {
      const n = Number(form.salary);

      if (!Number.isInteger(n) || n < 0 || n > 100_000_000) {
        return "Зарплата должна быть целым числом от 0 до 100 000 000";
      }
    }

    const { type, min, max, more } = experienceSelection;

    if (type === "range") {
      if (
        min === "" ||
        max === "" ||
        Number(min) < 0 ||
        Number(max) > 50 ||
        Number(min) >= Number(max)
      ) {
        return "Укажите корректный диапазон стажа";
      }
    }

    if (
      type === "more" &&
      (!more || Number(more) < 1 || Number(more) > 50)
    ) {
      return "Укажите количество лет от 1 до 50";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      ...form,
      hiring_plan: form.hiring_plan ? Number(form.hiring_plan) : null,
      salary: form.salary ? Number(form.salary) : null,
      experience_required: buildExperienceLevel(experienceSelection),
    };

    try {
      if (isEdit) {
        await vacancyService.update(id, payload);
      } else {
        await vacancyService.create(payload);
      }

      setSuccess(true);
      setTimeout(() => navigate("/my-vacancies"), 700);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка сохранения");
    }
  };

  if (loading) {
    return <div className="auth-container">Загрузка...</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: 600 }}>
      <h1>{isEdit ? "Редактировать вакансию" : "Новая вакансия"}</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          name="vac_title"
          placeholder="Название вакансии"
          value={form.vac_title || ""}
          onChange={handleChange}
          required
        />

        <input
          name="specialization"
          placeholder="Специализация"
          value={form.specialization || ""}
          onChange={handleChange}
        />

        <input
          name="hiring_plan"
          type="number"
          min="1"
          max="10000"
          placeholder="План найма (чел.)"
          value={form.hiring_plan || ""}
          onChange={handleChange}
        />

        <select
          name="employment_type"
          value={form.employment_type || "full"}
          onChange={handleChange}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--line-strong)",
          }}
        >
          <option value="full">Полная занятость</option>
          <option value="part">Частичная занятость</option>
          <option value="project">Проектная работа</option>
          <option value="internship">Стажировка</option>
        </select>

        <label style={{ display: "block", marginTop: 8, marginBottom: 8 }}>
          График работы
        </label>
        <select
          name="schedule"
          value={form.schedule || ""}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--line-strong)",
          }}
        >
          <option value="">Выберите график</option>
          {form.schedule && !VACANCY_SCHEDULE_OPTIONS.some((item) => item.value === form.schedule) && (
            <option value={form.schedule}>{form.schedule}</option>
          )}
          {VACANCY_SCHEDULE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>

        <input
          name="salary"
          type="number"
          min="0"
          max="100000000"
          placeholder="Зарплата в месяц"
          value={form.salary || ""}
          required
          onChange={handleChange}
        />

        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Требуемый стаж работы
          </label>

          <select
            name="type"
            value={experienceSelection.type}
            onChange={handleExperienceChange}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--line-strong)",
            }}
          >
            <option value="">Выберите стаж</option>
            <option value="none">Без опыта</option>
            <option value="range">Диапазон</option>
            <option value="more">Более</option>
          </select>

          {experienceSelection.type === "range" && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <div style={{ flex: 1 }}>
                <label>От, лет</label>
                <input
                  type="number"
                  name="min"
                  min="0"
                  max="49"
                  value={experienceSelection.min}
                  onChange={handleExperienceChange}
                  required
                />
              </div>

              <div style={{ flex: 1 }}>
                <label>До, лет</label>
                <input
                  type="number"
                  name="max"
                  min="1"
                  max="50"
                  value={experienceSelection.max}
                  onChange={handleExperienceChange}
                  required
                />
              </div>
            </div>
          )}

          {experienceSelection.type === "more" && (
            <div style={{ marginTop: 10 }}>
              <label>Более скольких лет?</label>
              <input
                type="number"
                name="more"
                min="1"
                max="50"
                value={experienceSelection.more}
                onChange={handleExperienceChange}
                required
              />
            </div>
          )}
        </div>

        <input
          name="skills_required"
          placeholder="Навыки (через запятую)"
          value={form.skills_required || ""}
          onChange={handleChange}
        />

        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Регион работы
          </label>

          <select
            name="vac_region"
            value={form.vac_region || ""}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--line-strong)",
            }}
          >
            <option value="">Выберите регион</option>

            {form.vac_region &&
              !REGIONS.includes(form.vac_region) && (
                <option value={form.vac_region}>
                  {form.vac_region}
                </option>
              )}

            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <textarea
          name="vac_description"
          placeholder="Описание вакансии"
          value={form.vac_description || ""}
          onChange={handleChange}
          rows={5}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--line-strong)",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />

        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "green" }}>Сохранено</p>}

        <button type="submit">
          {isEdit ? "Сохранить изменения" : "Опубликовать"}
        </button>
      </form>

      <div className="auth-footer">
        <a
          onClick={() => navigate("/my-vacancies")}
          style={{ cursor: "pointer" }}
        >
          ← Мои вакансии
        </a>
      </div>
    </div>
  );
}
