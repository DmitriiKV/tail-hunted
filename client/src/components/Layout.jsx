
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/notificationService";

const NAV = {
  candidate: [
    { to: "/vacancies", label: "Вакансии" },
    { to: "/my-applications", label: "Мои отклики" },
    { to: "/resume", label: "Резюме" },
  ],
  employer: [
    { to: "/resumes", label: "Кандидаты" },
    { to: "/my-vacancies", label: "Вакансии" },
    { to: "/invitations", label: "Приглашения" },
    { to: "/company", label: "Компания" },
  ],
};

const POLL_MS = 60_000;

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;

    const refresh = () =>
      notificationService
        .unreadCount()
        .then((count) => active && setUnread(count))
        .catch(() => {});

    refresh();

    const timer = setInterval(refresh, POLL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="brand">
            Tail<span>-</span>Hunted
          </Link>

          <nav className="nav">
            {(NAV[user.role] || []).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-tools">
            <Link
              to="/notifications"
              className="bell"
              aria-label="Уведомления"
            >
              Уведомления
              {unread > 0 && (
                <span className="bell-count">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>

            <button className="btn-logout" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
