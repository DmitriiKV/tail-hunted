import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoad } from "../hooks/useLoad";
import { apiError, formatDate } from "../utils/format";
import { applicationService } from "../services/applicationService";
import { companyService } from "../services/companyService";
import { invitationService } from "../services/invitationService";
import { resumeService } from "../services/resumeService";
import { vacancyService } from "../services/vacancyService";

const settle = (promise, fallback) => promise.catch(() => fallback);

function ContactRequests({ requests, onChange }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const respond = async (id, status) => {
    setBusyId(id);
    setError("");
    try {
      await resumeService.respondToContactRequest(id, status);
      onChange(requests.map((r) => (r.request_id === id ? { ...r, status } : r)));
    } catch (err) {
      setError(apiError(err, "Не удалось сохранить ответ"));
    } finally {
      setBusyId(null);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  if (pending.length === 0) return null;

  return (
    <>
      <h2 className="section-title">Просят доступ к вашему email</h2>
      {error && <p className="error">{error}</p>}
      {pending.map((request) => (
        <div key={request.request_id} className="card row-between">
          <div>
            <strong>{request.company_name || request.employer_name}</strong>
            <div className="muted">
              Резюме «{request.resume_title}» · {formatDate(request.created_at)}
            </div>
          </div>
          <div className="row">
            <button className="btn-primary" disabled={busyId === request.request_id} onClick={() => respond(request.request_id, "approved")}>
              Разрешить
            </button>
            <button disabled={busyId === request.request_id} onClick={() => respond(request.request_id, "rejected")}>
              Отклонить
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

function CandidateHome() {
  const { data, setData, loading } = useLoad(async () => {
    const [resumes, applications, invitations, contacts] = await Promise.all([
      settle(resumeService.getMy(), []),
      settle(applicationService.mine(), []),
      settle(invitationService.received(), []),
      settle(resumeService.getContactRequests(), { requests: [] }),
    ]);
    return { resume: resumes[0] || null, applications, invitations, contacts: contacts.requests };
  });

  if (loading || !data) return <p className="muted">Загрузка…</p>;

  const { resume, applications, invitations, contacts } = data;
  const waiting = applications.filter((a) => ["pending", "viewed"].includes(a.status)).length;
  const newInvitations = invitations.filter((i) => i.status === "pending" && i.is_new);
  const newInvitationCount = newInvitations.length;

  return (
    <>
      {!resume && (
        <div className="card">
          <h2>Начните с резюме</h2>
          <p className="muted">Без резюме мы не сможем подобрать вакансии и посчитать совпадение.</p>
          <Link to="/resume" className="btn-primary">Создать резюме</Link>
        </div>
      )}

      <div className="stats">
        <Link to="/invitations" className="stat">
          <b>{newInvitationCount}</b>
          <span>новых приглашений</span>
        </Link>
        <Link to="/my-applications" className="stat">
          <b>{waiting}</b>
          <span>откликов без решения</span>
        </Link>
        <Link to="/my-applications" className="stat">
          <b>{applications.length}</b>
          <span>откликов всего</span>
        </Link>
      </div>

      {resume && (
        <div className="card row-between">
          <div>
            <div className="info-label">Ваше резюме</div>
            <strong>{resume.res_title}</strong>
          </div>
          <div className="row">
            <Link to="/vacancies" className="btn-primary">Подобрать вакансии</Link>
            <Link to="/resume" className="btn-secondary">Изменить резюме</Link>
          </div>
        </div>
      )}

      <section>
        <div className="row-between">
          <h2 className="section-title">Новые приглашения</h2>
          <Link to="/invitations" className="btn-small">Все приглашения</Link>
        </div>
        {newInvitationCount === 0 ? (
          <div className="empty">Новых приглашений пока нет.</div>
        ) : (
          newInvitations.slice(0, 5).map((invitation) => (
            <div className="card row-between" key={invitation.inv_id}>
              <div>
                <strong>{invitation.company.comp_name}</strong>
                <div>{invitation.vacancy.vac_title}</div>
                <div className="muted">{formatDate(invitation.created_at)}</div>
              </div>
              <Link to="/invitations" className="btn-primary">Посмотреть</Link>
            </div>
          ))
        )}
      </section>

      <ContactRequests requests={contacts} onChange={(next) => setData({ ...data, contacts: next })} />
    </>
  );
}

function EmployerHome() {
  const { data, loading } = useLoad(async () => {
    const [company, vacancies, invitations] = await Promise.all([
      settle(companyService.getMy(), null),
      settle(vacancyService.getMy(), []),
      settle(invitationService.sent(), []),
    ]);
    return { company, vacancies, invitations };
  });

  if (loading || !data) return <p className="muted">Загрузка…</p>;

  const { company, vacancies, invitations } = data;
  const newVacancies = vacancies.filter((vacancy) => vacancy.applications_new > 0);
  const newApplications = newVacancies.reduce((sum, vacancy) => sum + vacancy.applications_new, 0);
  const awaiting = invitations.filter((invitation) => invitation.status === "pending").length;

  if (!company) {
    return (
      <div className="card">
        <h2>Начните с компании</h2>
        <p className="muted">Название и регион компании увидят кандидаты на странице вакансии.</p>
        <Link to="/company" className="btn-primary">Создать компанию</Link>
      </div>
    );
  }

  return (
    <>
      <div className="stats">
        <Link to="/my-vacancies" className="stat">
          <b>{newApplications}</b>
          <span>новых откликов</span>
        </Link>
        <Link to="/my-vacancies" className="stat">
          <b>{vacancies.length}</b>
          <span>активных вакансий</span>
        </Link>
        <Link to="/invitations" className="stat">
          <b>{awaiting}</b>
          <span>приглашений ждут ответа</span>
        </Link>
      </div>

      <div className="card row-between">
        <div>
          <div className="info-label">Ваша компания</div>
          <strong>{company.comp_name}</strong>
        </div>
        <div className="row">
          <Link to="/resumes" className="btn-primary">Подобрать кандидатов</Link>
          <Link to="/my-vacancies" className="btn-secondary">Мои вакансии</Link>
        </div>
      </div>

      <section>
        <div className="row-between">
          <h2 className="section-title">Новые отклики</h2>
          <Link to="/applications/all" className="btn-small">Все отклики</Link>
        </div>
        {newVacancies.length === 0 ? (
          <div className="empty">Новых откликов пока нет.</div>
        ) : (
          newVacancies.map((vacancy) => (
            <div key={vacancy.vac_id} className="card row-between">
              <div>
                <strong>{vacancy.vac_title}</strong>
                <div className="muted">
                  Новых откликов: {vacancy.applications_new} · Всего: {vacancy.applications_total}
                </div>
              </div>
              <Link to={`/vacancy/${vacancy.vac_id}/applications`} className="btn-primary">
                Посмотреть отклики
              </Link>
            </div>
          ))
        )}
      </section>
    </>
  );
}

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="auth-container">
      <h1>Здравствуйте, {user.first_name}</h1>
      {user.role === "candidate" ? <CandidateHome /> : <EmployerHome />}
    </div>
  );
}
