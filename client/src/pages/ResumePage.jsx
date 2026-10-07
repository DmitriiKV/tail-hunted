import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { resumeService } from "../services/resumeService";

export default function ResumePage() {
  const [form, setForm] = useState({
    res_title: "",
    gender: "",
    birth_date: "",
    salary_expectation: "",
    professional_area: "",
    education: "",
    skills: "",
    experience: "",
  });
  const [exists, setExists] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    resumeService
      .getMy()
      .then((list) => {
        if (list.length > 0) {
          setForm(list[0]);
          setExists(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const salary = form.salary_expectation;
    if (salary && (Number(salary) < 0 || Number(salary) > 100_000_000)) {
      setError("Зарплата должна быть от 0 до 100 000 000");
      return;
    }

    try {
      const payload = {
        ...form,
        salary_expectation: salary ? Number(salary) : null,
      };

      if (exists) {
        await resumeService.update(form.res_id, payload);
      } else {
        const created = await resumeService.create(payload);
        setForm(created);
        setExists(true);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка сохранения");
    }
  };

  return (
    <div className="auth-container" style={{ maxWidth: 600 }}>
      <h1>{exists ? "Моё резюме" : "Создать резюме"}</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input name="res_title" placeholder="Желаемая должность" value={form.res_title || ""} onChange={handleChange} required />
        <select name="gender" value={form.gender || ""} onChange={handleChange} style={{ padding: 12, borderRadius: 8, border: "1px solid #d0d5dd" }}>
          <option value="">Пол</option>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>
        <label style={{ fontSize: 14, color: "#667085", marginTop: 4 }}>Дата рождения</label>
        <input name="birth_date" type="date" value={form.birth_date || ""} onChange={handleChange} />
        <input name="salary_expectation" type="number" min="0" max="100000000" placeholder="Желаемая зарплата" value={form.salary_expectation || ""} onChange={handleChange} />
        <input name="professional_area" placeholder="Профессиональная область" value={form.professional_area || ""} onChange={handleChange} />
        <input name="education" placeholder="Образование" value={form.education || ""} onChange={handleChange} />
        <input name="skills" placeholder="Навыки (через запятую)" value={form.skills || ""} onChange={handleChange} />
        <textarea
          name="experience"
          placeholder="Опыт работы"
          value={form.experience || ""}
          onChange={handleChange}
          rows={4}
          style={{ padding: 12, borderRadius: 8, border: "1px solid #d0d5dd", fontFamily: "inherit", resize: "vertical" }}
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