
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resumeService } from "../services/resumeService";
import { REGIONS, ANY_REGION } from "../constants/regions";

const initialForm = {
  res_title: "",
  gender: "",
  birth_date: "",
  salary_expectation: "",
  professional_area: "",
  preferred_region: ANY_REGION,
  education: "",
  skills: "",
  experience: "",
  experience_level: "",
};

function parseExperienceLevel(value) {
  if (!value || value === "Без опыта") {
    return {
      type: value === "Без опыта" ? "none" : "",
      min: "",
      max: "",
      more: "",
    };
  }

  const range = value.match(/^От\s+(\d+)\s+до\s+(\d+)\s+лет?$/i);

  if (range) {
    return { type: "range", min: range[1], max: range[2], more: "" };
  }

  const more = value.match(/^Более\s+(\d+)\s+лет?$/i);

  if (more) {
    return { type: "more", min: "", max: "", more: more[1] };
  }

  return { type: "", min: "", max: "", more: "" };
}

function buildExperienceLevel(selection) {
  if (selection.type === "none") return "Без опыта";

  if (selection.type === "range") {
    return `От ${selection.min} до ${selection.max} лет`;
  }

  if (selection.type === "more") {
    return `Более ${selection.more} лет`;
  }

  return "";
}

export default function ResumePage() {
  const [form, setForm] = useState(initialForm);

  const [experienceSelection, setExperienceSelection] = useState({
    type: "",
    min: "1",
    max: "3",
    more: "5",
  });

  const [exists, setExists] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    resumeService
      .getMy()
      .then((list) => {
        if (list.length > 0) {
          const resume = list[0];

          setForm({
            ...initialForm,
            ...resume,
            preferred_region: resume.preferred_region || ANY_REGION,
          });

          setExperienceSelection(
            parseExperienceLevel(resume.experience_level)
          );

          setExists(true);
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.error ||
          "Не удалось загрузить резюме. Попробуйте обновить страницу."
        );
      })
      .finally(() => setLoading(false));
  }, []);

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

  const validateExperience = () => {
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

    if (type === "more" && (!more || Number(more) < 1 || Number(more) > 50)) {
      return "Укажите количество лет от 1 до 50";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const salary = form.salary_expectation;

    if (salary && (Number(salary) < 0 || Number(salary) > 100_000_000)) {
      setError("Зарплата должна быть от 0 до 100 000 000");
      return;
    }

    const experienceError = validateExperience();

    if (experienceError) {
      setError(experienceError);
      return;
    }

    try {
      const payload = {
        ...form,
        preferred_region: form.preferred_region || ANY_REGION,
        salary_expectation: salary ? Number(salary) : null,
        experience_level: buildExperienceLevel(experienceSelection),
      };

      if (exists) {
        await resumeService.update(form.res_id, payload);
      } else {
        const created = await resumeService.create(payload);

        setForm({
          ...initialForm,
          ...created,
          preferred_region: created.preferred_region || ANY_REGION,
        });

        setExists(true);
      }

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка сохранения");
    }
  };

  if (loading) {
    return <div className="auth-container">Загрузка резюме...</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: 600 }}>
      <h1>{exists ? "Моё резюме" : "Создать резюме"}</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          name="res_title"
          placeholder="Желаемая должность"
          value={form.res_title || ""}
          onChange={handleChange}
          required
        />

        <select
          name="gender"
          value={form.gender || ""}
          onChange={handleChange}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d0d5dd" }}
        >
          <option value="">Пол</option>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>

        <label style={{ fontSize: 14, color: "#667085", marginTop: 4 }}>
          Дата рождения
        </label>

        <input
          name="birth_date"
          type="date"
          value={form.birth_date || ""}
          onChange={handleChange}
        />

        <input
          name="salary_expectation"
          type="number"
          min="0"
          max="100000000"
          placeholder="Желаемая зарплата"
          value={form.salary_expectation || ""}
          onChange={handleChange}
        />

        <input
          name="professional_area"
          placeholder="Профессиональная область"
          value={form.professional_area || ""}
          onChange={handleChange}
        />

        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Предпочтительный регион работы
          </label>

          <select
            name="preferred_region"
            value={form.preferred_region || ANY_REGION}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d0d5dd",
            }}
          >
            <option value={ANY_REGION}>{ANY_REGION}</option>

            {form.preferred_region &&
              form.preferred_region !== ANY_REGION &&
              !REGIONS.includes(form.preferred_region) && (
                <option value={form.preferred_region}>
                  {form.preferred_region}
                </option>
              )}

            {REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <input
          name="education"
          placeholder="Образование"
          value={form.education || ""}
          onChange={handleChange}
        />

        <input
          name="skills"
          placeholder="Навыки (через запятую)"
          value={form.skills || ""}
          onChange={handleChange}
        />

        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Стаж работы
          </label>

          <select
            name="type"
            value={experienceSelection.type}
            onChange={handleExperienceChange}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d0d5dd",
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

        <textarea
          name="experience"
          placeholder="Опыт работы: места работы, должности, обязанности и достижения"
          value={form.experience || ""}
          onChange={handleChange}
          rows={4}
          style={{
            padding: 12,
            borderRadius: 8,
            border: "1px solid #d0d5dd",
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />

        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "green" }}>Сохранено</p>}

        <button type="submit">
          {exists ? "Сохранить изменения" : "Создать резюме"}
        </button>
      </form>

      <div className="auth-footer">
        <a onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          ← На главную
        </a>
      </div>
    </div>
  );
}
