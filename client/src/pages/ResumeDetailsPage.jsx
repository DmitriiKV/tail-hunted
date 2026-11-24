import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import MatchPanel from "../components/MatchPanel";
import ResumeView from "../components/ResumeView";
import { useLoad } from "../hooks/useLoad";
import { apiError } from "../utils/format";
import { invitationService } from "../services/invitationService";
import { matchingService } from "../services/matchingService";
import { resumeService } from "../services/resumeService";
import { vacancyService } from "../services/vacancyService";

export default function ResumeDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const { data: resume, loading, error } = useLoad(() => resumeService.getById(id), [id]);
  const { data: vacancies } = useLoad(() => vacancyService.getMy());

  const [vacancyId, setVacancyId] = useState(String(location.state?.vacancyId || ""));
  const [scored, setScored] = useState({ key: "", match: null });
  const [message, setMessage] = useState("");
  const [inviteState, setInviteState] = useState({ busy: false, error: "", sent: false });
  const [contactNote, setContactNote] = useState("");

  const activeVacancies = vacancies || [];

  useEffect(() => {
    if (!vacancyId) return;
    const key = `${id}:${vacancyId}`;
    matchingService
      .getResumeMatchScore(id, vacancyId)
      .then((match) => setScored({ key, match }))
      .catch(() => setScored({ key, match: null }));
  }, [id, vacancyId]);

  const match = scored.key === `${id}:${vacancyId}` ? scored.match : null;

  const invite = async () => {
    setInviteState({ busy: true, error: "", sent: false });
    try {
      await invitationService.create({ vac_id: Number(vacancyId), res_id: Number(id), message });
      setInviteState({ busy: false, error: "", sent: true });
      setMessage("");
    } catch (err) {
      setInviteState({ busy: false, error: apiError(err, "Не удалось отправить приглашение"), sent: false });
    }
  };

  const requestContacts = async () => {
    try {
      const response = await resumeService.requestContacts(id);
      setContactNote(response.message);
    } catch (err) {
      setContactNote(apiError(err, "Не удалось отправить запрос"));
    }
  };

  if (loading) return <p className="muted">Загрузка…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="auth-container">
      <Link to="/resumes" className="muted">← Кандидаты</Link>
      <div style={{ height: 12 }} />

      <div className="card">
        <label htmlFor="vacancy-select">Выберите вакансию для приглашения</label>
        <select id="vacancy-select" value={vacancyId} onChange={(e) => setVacancyId(e.target.value)}>
          <option value="">Выберите вакансию</option>
          {activeVacancies.map((v) => (
            <option key={v.vac_id} value={v.vac_id}>{v.vac_title}</option>
          ))}
        </select>
      </div>

      <MatchPanel match={match} title="Совпадение с выбранной вакансией" missingTitle="Нет у кандидата:" />
      <ResumeView resume={resume} />

      {vacancyId && (
        <div className="card stack">
          <h3>Приглашение</h3>
          <textarea
            value={message}
            maxLength={500}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Сообщение кандидату (необязательно)"
          />
          <div className="row">
            <button className="btn-primary" onClick={invite} disabled={inviteState.busy}>
              {inviteState.busy ? "Отправляем…" : "Пригласить на вакансию"}
            </button>
            <Link to="/invitations" className="btn-small">Отправленные</Link>
          </div>
          {inviteState.sent && <div className="notice">Приглашение отправлено, кандидат получил уведомление.</div>}
          {inviteState.error && <p className="error">{inviteState.error}</p>}
        </div>
      )}

      <div className="card">
        <h3>Контакты</h3>
        {resume.contact_email ? (
          <a href={`mailto:${resume.contact_email}`}>{resume.contact_email}</a>
        ) : (
          <>
            <p className="muted">Email скрыт. Кандидат решает, открывать ли его вам.</p>
            <button onClick={requestContacts} disabled={Boolean(contactNote)}>Запросить контакты</button>
            {contactNote && <p style={{ marginTop: 8 }}>{contactNote}</p>}
          </>
        )}
      </div>
    </div>
  );
}
