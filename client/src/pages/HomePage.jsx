import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { companyService } from "../services/companyService";
import { resumeService } from "../services/resumeService";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [resume, setResume] = useState(null);

  useEffect(() => {
    if (user?.role === "employer") {
      companyService
        .getMy()
        .then(setCompany)
        .catch(() => setCompany(null));
    }
    if (user?.role === "candidate") {
      resumeService
        .getMy()
        .then((list) => setResume(list[0] || null))
        .catch(() => setResume(null));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <h1>
        Привет, {user?.first_name} {user?.last_name}!
      </h1>

      {user?.role === "employer" && (
        <div className="info-card">
          {company ? (
            <>
              <div className="info-label">Ваша компания</div>
              <div className="info-value">{company.comp_name}</div>
              {company.comp_region && (
                <div className="info-sub">{company.comp_region}</div>
              )}
            </>
          ) : (
            <div className="info-sub">Компания ещё не создана</div>
          )}
        </div>
      )}

      {user?.role === "candidate" && (
        <div className="info-card">
          {resume ? (
            <>
              <div className="info-label">Ваше резюме</div>
              <div className="info-value">{resume.res_title}</div>
              {resume.skills && (
                <div className="info-sub">{resume.skills}</div>
              )}
            </>
          ) : (
            <div className="info-sub">Резюме ещё не создано</div>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 20,
        }}
      >
        {user?.role === "candidate" && (
          <>
            <Link to="/resume" className="btn-primary">
              {resume ? "Редактировать резюме" : "Создать резюме"}
            </Link>
            <Link to="/vacancies" className="btn-secondary">
              Смотреть вакансии
            </Link>
          </>
        )}

        {user?.role === "employer" && (
          <>
            <Link to="/company" className="btn-primary">
              {company ? "Редактировать компанию" : "Создать компанию"}
            </Link>
            <Link to="/vacancy/new" className="btn-primary">
              Создать вакансию
            </Link>
            <Link to="/my-vacancies" className="btn-secondary">
              Мои вакансии
            </Link>
            <Link to="/resumes" className="btn-secondary">
              Смотреть резюме
            </Link>
          </>
        )}
      </div>

      <button onClick={handleLogout} className="btn-logout">
        Выйти
      </button>
    </div>
  );
}