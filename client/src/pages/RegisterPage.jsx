import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    role: "candidate",
  });
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const data = await authService.register(form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка регистрации");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
      <h1>Регистрация</h1>
      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          name="last_name"
          type="text"
          placeholder="Фамилия"
          onChange={handleChange}
          required
        />
        <input
          name="first_name"
          type="text"
          placeholder="Имя"
          onChange={handleChange}
          required
        />
        <input
          name="middle_name"
          type="text"
          placeholder="Отчество"
          onChange={handleChange}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Пароль"
          onChange={handleChange}
          required
        />

        <div className="role-group">
          <label>
            <input
              type="radio"
              name="role"
              value="candidate"
              checked={form.role === "candidate"}
              onChange={handleChange}
            />
            Я ищу работу
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="employer"
              checked={form.role === "employer"}
              onChange={handleChange}
            />
            Я ищу сотрудника
          </label>
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit">Зарегистрироваться</button>
      </form>
      <div className="auth-footer">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </div>
      </div>
    </div>
  );
}