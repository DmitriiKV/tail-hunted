import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <h1>
        Привет, {user?.first_name} {user?.last_name}!
      </h1>
      <p style={{ textAlign: "center", color: "#667085" }}>
        Роль: {user?.role === "candidate" ? "Соискатель" : "Работодатель"}
      </p>
      <button
        onClick={handleLogout}
        style={{
          width: "100%",
          padding: 12,
          background: "#4f46e5",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 15,
        }}
      >
        Выйти
      </button>
    </div>
  );
}