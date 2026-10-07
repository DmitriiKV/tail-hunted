import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { vacancyService } from "../services/vacancyService";

export default function MyVacanciesPage() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    vacancyService
      .getMy()
      .then(setVacancies)
      .catch((err) => setError(err.response?.data?.error || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Удалить вакансию "${title}"?`)) return;
    try {
      await vacancyService.remove(id);
      setVacancies((prev) => prev.filter((v) => v.vac_id !== id));
    } catch (err) {
      alert(err.response?.data?.error || "Не удалось удалить");
    }
  };

  if (loading) return <div className="auth-container">Загрузка...</div>;

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <h1>Мои вакансии</h1>
      {error && <p className="error">{error}</p>}
      {vacancies.length === 0 && !error && (
        <p style={{ textAlign: "center", color: "#667085" }}>
          У вас пока нет вакансий.
        </p>
      )}
      {vacancies.map((v) => (
        <div key={v.vac_id} className="vacancy-card">
          <div className="vacancy-card-body">
            <h3>{v.vac_title}</h3>
            <p style={{ margin: "0 0 4px", color: "#4f46e5", fontWeight: 500 }}>
              {v.salary ? `${v.salary} ₽` : "з/п не указана"}
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#667085" }}>
              {v.vac_region} · {v.employment_type}
            </p>
          </div>
          <div className="vacancy-card-actions">
            <Link to={`/vacancy/${v.vac_id}/edit`} className="btn-small">
              Редактировать
            </Link>
            <button
              className="btn-small danger"
              onClick={() => handleDelete(v.vac_id, v.vac_title)}
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
      <div className="auth-footer">
        <Link to="/vacancy/new">+ Создать вакансию</Link>
        <br />
        <Link to="/" style={{ marginTop: 8, display: "inline-block" }}>
          ← На главную
        </Link>
      </div>
    </div>
  );
}