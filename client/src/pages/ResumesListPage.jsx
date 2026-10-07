import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resumeService } from "../services/resumeService";

export default function ResumesListPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    resumeService
      .listAll()
      .then(setResumes)
      .catch((err) => setError(err.response?.data?.error || "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="auth-container">Загрузка...</div>;

  return (
    <div className="auth-container" style={{ maxWidth: 720 }}>
      <h1>Резюме соискателей</h1>
      {error && <p className="error">{error}</p>}
      {resumes.length === 0 && !error && (
        <p style={{ textAlign: "center", color: "#667085" }}>
          Пока нет резюме.
        </p>
      )}
      {resumes.map((r) => (
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
          <p style={{ margin: "0 0 4px", color: "#0000FF", fontWeight: 500 }}>
            {r.salary_expectation
              ? `${r.salary_expectation} ₽`
              : "з/п не указана"}
          </p>
          <p style={{ margin: "0 0 6px", color: "#667085", fontSize: 14 }}>
            {r.professional_area || "область не указана"} ·{" "}
            {r.education || "образование не указано"}
          </p>
          {r.skills && (
            <p style={{ margin: "0 0 6px", fontSize: 14, color: "#475467" }}>
              <strong>Навыки:</strong> {r.skills}
            </p>
          )}
          {r.experience && (
            <p style={{ margin: 0, fontSize: 14, color: "#475467" }}>
              {r.experience}
            </p>
          )}
        </div>
      ))}
      <div className="auth-footer">
        <Link to="/">← На главную</Link>
      </div>
    </div>
  );
}