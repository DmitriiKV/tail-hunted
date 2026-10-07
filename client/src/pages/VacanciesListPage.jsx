import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { vacancyService } from "../services/vacancyService";

export default function VacanciesListPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vacancyService
      .listAll()
      .then(setVacancies)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="auth-container">Загрузка...</div>;

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <h1>Вакансии</h1>
      {vacancies.length === 0 && <p>Пока нет вакансий.</p>}
      {vacancies.map((v) => (
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
          <p style={{ margin: "0 0 6px", color: "#0000FF", fontWeight: 500 }}>
            {v.salary ? `${v.salary} ₽` : "з/п не указана"}
          </p>
          <p style={{ margin: "0 0 6px", color: "#667085", fontSize: 14 }}>
            {v.vac_region} · {v.experience_required || "опыт не указан"} ·{" "}
            {v.employment_type}
          </p>
          <p style={{ margin: "0 0 6px", fontSize: 14 }}>{v.skills_required}</p>
          <p style={{ margin: 0, fontSize: 14, color: "#475467" }}>
            {v.vac_description}
          </p>
        </div>
      ))}
      <div className="auth-footer">
        <Link to="/">← На главную</Link>
      </div>
    </div>
  );
}