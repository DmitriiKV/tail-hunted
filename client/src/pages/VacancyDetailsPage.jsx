import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import MatchPanel from "../components/MatchPanel";
import { useLoad } from "../hooks/useLoad";
import { apiError, EMPLOYMENT_LABELS, formatDate, formatSalary } from "../utils/format";
import { applicationService } from "../services/applicationService";
import { matchingService } from "../services/matchingService";
import { vacancyService } from "../services/vacancyService";

export default function VacancyDetailsPage() {
  const { id } = useParams();
  const { data: vacancy, loading, error } = useLoad(() => vacancyService.getById(id), [id]);
  const [match, setMatch] = useState(null);
  const [applied, setApplied] = useState(null);
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    matchingService.getVacancyMatchScore(id).then(setMatch).catch(() => setMatch(null));
    applicationService
      .mine()
      .then((list) => setApplied(list.some((a) => String(a.vac_id) === String(id))))
      .catch(() => setApplied(false));
  }, [id]);

  const apply = async () => {
    setBusy(true);
    setApplyError("");
    try {
      await applicationService.create(Number(id));
      setApplied(true);
    } catch (err) {
      if (err.response?.status === 409 && applied !== false) setApplied(true);
      setApplyError(apiError(err, "Не удалось отправить отклик"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="muted">Загрузка…</p>;
  if (error) return <p className="error">{error}</p>;

  const { company } = vacancy;
  const salary = formatSalary(vacancy.salary);

  return (
    <div className="auth-container">
      <Link to="/vacancies" className="muted">← Вакансии</Link>
      <h1 style={{ marginTop: 8 }}>{vacancy.vac_title}</h1>
      <p style={{ fontSize: 20, fontWeight: 600 }}>{salary || <span className="muted">Зарплата не указана</span>}</p>

      <MatchPanel match={match} title="Совпадение с вашим резюме" missingTitle="Чего не хватает в резюме:" />

      <div className="card">
        <dl className="facts">
          <div><dt>Регион</dt><dd>{vacancy.vac_region || "—"}</dd></div>
          <div><dt>Специализация</dt><dd>{vacancy.specialization || "—"}</dd></div>
          <div><dt>Опыт</dt><dd>{vacancy.experience_required || "—"}</dd></div>
          <div><dt>Занятость</dt><dd>{EMPLOYMENT_LABELS[vacancy.employment_type] || "—"}</dd></div>
          <div><dt>График</dt><dd>{vacancy.schedule || "—"}</dd></div>
          <div><dt>Опубликована</dt><dd>{formatDate(vacancy.vac_created_at)}</dd></div>
        </dl>
        <h3>Навыки</h3>
        <p>{vacancy.skills_required || "Не указаны"}</p>
        <h3>Описание</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{vacancy.vac_description || "Описание не заполнено"}</p>
      </div>

      {company && (
        <div className="card">
          <h3>{company.comp_name}</h3>
          <p className="muted">
            {[company.comp_region, company.address, company.size && `сотрудников: ${company.size}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {company.response_rate !== null && (
            <p>
              Отвечает на {company.response_rate}% откликов
            </p>
          )}
          {company.comp_description && <p style={{ whiteSpace: "pre-wrap" }}>{company.comp_description}</p>}
        </div>
      )}

      {applied ? (
        <div className="notice">
          Отклик отправлен. Статус вы увидите в разделе <Link to="/my-applications">«Мои отклики»</Link>.
        </div>
      ) : (
        <button className="btn-primary" onClick={apply} disabled={busy || applied === null}>
          {busy ? "Отправляем…" : "Откликнуться"}
        </button>
      )}
      {applyError && <p className="error" style={{ marginTop: 10 }}>{applyError}</p>}
    </div>
  );
}
