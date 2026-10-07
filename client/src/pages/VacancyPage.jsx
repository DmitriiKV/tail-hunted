import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { vacancyService } from "../services/vacancyService";

export default function VacancyPage() {
  const { id } = useParams(); // если есть id — режим редактирования
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEdit) return;
    vacancyService
      .getById(id)
      .then((v) => setForm({ ...v, hiring_plan: v.hiring_plan ?? "", salary: v.salary ?? "" }))
      .catch((err) => setError(err.response?.data?.error || "Не удалось загрузить"))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (form.hiring_plan) {
      const n = Number(form.hiring_plan);
      if (!Number.isInteger(n) || n < 1 || n > 10000) {
        return "План найма должен быть целым числом от 1 до 10 000";
      }
    }
    if (form.salary) {
      const n = Number(form.salary);
      if (!Number.isInteger(n) || n < 0 || n > 100_000_000) {
        return "Зарплата должна быть целым числом от 0 до 100 000 000";
      }
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
        <input name="vac_title" placeholder="Название вакансии" value={form.vac_title || ""} onChange={handleChange} required />
        <input name="specialization" placeholder="Специализация" value={form.specialization || ""} onChange={handleChange} />
        <input name="hiring_plan" type="number" min="1" max="10000" placeholder="План найма (чел.)" value={form.hiring_plan || ""} onChange={handleChange} />
        <select name="employment_type" value={form.employment_type || "full"} onChange={handleChange} style={{ padding: 12, borderRadius: 8, border: "1px solid #d0d5dd" }}>
          <option value="full">Полная занятость</option>
          <option value="part">Частичная занятость</option>
          <option value="project">Проектная работа</option>
          <option value="internship">Стажировка</option>
        </select>
        <input name="schedule" placeholder="График (5/2, 2/2, гибкий)" value={form.schedule || ""} onChange={handleChange} />
        <input name="salary" type="number" min="0" max="100000000" placeholder="Зарплата в месяц" value={form.salary || ""} onChange={handleChange} />
        <input name="experience_required" placeholder="Опыт работы" value={form.experience_required || ""} onChange={handleChange} />
        <input name="skills_required" placeholder="Навыки (через запятую)" value={form.skills_required || ""} onChange={handleChange} />
        <input name="vac_region" placeholder="Регион" value={form.vac_region || ""} onChange={handleChange} />
        <textarea
          name="vac_description"
          placeholder="Описание вакансии"
          value={form.vac_description || ""}
          onChange={handleChange}
          rows={5}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d0d5dd", fontFamily: "inherit", resize: "vertical" }}
        />
        {error && <p className="error">{error}</p>}
        {success && <p style={{ color: "green" }}>Сохранено</p>}
        <button type="submit">{isEdit ? "Сохранить изменения" : "Опубликовать"}</button>
      </form>
      <div className="auth-footer">
        <a onClick={() => navigate("/my-vacancies")} style={{ cursor: "pointer" }}>
          ← Мои вакансии
        </a>
      </div>
    </div>
  );
}