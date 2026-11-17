
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { companyService } from "../services/companyService";
import { REGIONS } from "../constants/regions";

const initialForm = {
  comp_name: "",
  comp_region: "",
  address: "",
  size: "",
  comp_description: "",
  comp_phone: "",
  comp_email: "",
};

export default function CompanyPage() {
  const [form, setForm] = useState(initialForm);
  const [exists, setExists] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    companyService
      .getMy()
      .then((c) => {
        setForm({
          ...initialForm,
          ...c,
        });
        setExists(true);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setExists(false);
        } else {
          setError(
            err.response?.data?.error ||
            "Не удалось загрузить данные компании"
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.comp_region) {
      setError("Выберите регион компании");
      return;
    }

    try {
      if (exists) {
        await companyService.update(form);
      } else {
        const created = await companyService.create(form);
        setForm({
          ...initialForm,
          ...created,
        });
        setExists(true);
      }

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || "Ошибка сохранения");
    }
  };

  if (loading) {
    return <div className="auth-container">Загрузка...</div>;
  }

  return (
    <div className="auth-container" style={{ maxWidth: 600 }}>
      <h1>{exists ? "Моя компания" : "Создать компанию"}</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          name="comp_name"
          placeholder="Название компании"
          value={form.comp_name || ""}
          onChange={handleChange}
          required
        />

        <div style={{ marginTop: 8 }}>
          <label style={{ display: "block", marginBottom: 8 }}>
            Регион компании
          </label>

          <select
            name="comp_region"
            value={form.comp_region || ""}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d0d5dd",
            }}
          >
            <option value="">Выберите регион</option>

            {form.comp_region &&
              !REGIONS.includes(form.comp_region) && (
                <option value={form.comp_region}>
                  {form.comp_region}
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
          name="address"
          placeholder="Адрес"
          value={form.address || ""}
          onChange={handleChange}
        />

        <input
          name="size"
          placeholder="Размер (до 50, 50-200, 200+)"
          value={form.size || ""}
          onChange={handleChange}
        />

        <input
          name="comp_phone"
          placeholder="Телефон"
          value={form.comp_phone || ""}
          onChange={handleChange}
        />

        <input
          name="comp_email"
          placeholder="Email для связи"
          value={form.comp_email || ""}
          onChange={handleChange}
        />

        <textarea
          name="comp_description"
          placeholder="Описание компании"
          value={form.comp_description || ""}
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
          {exists ? "Сохранить изменения" : "Создать компанию"}
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
