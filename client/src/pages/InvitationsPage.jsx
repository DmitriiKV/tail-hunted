import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { useLoad } from "../hooks/useLoad";
import { apiError, formatDate, formatSalary } from "../utils/format";
import { DECLINE_REASONS, INVITATION_STATUS } from "../constants/status";
import { invitationService } from "../services/invitationService";

function ReceivedCard({ invitation, onChange }) {
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const respond = async (decision) => {
    setBusy(true);
    setError("");
    try {
      onChange(await invitationService.respond(invitation.inv_id, decision, reason));
    } catch (err) {
      setError(apiError(err, "Не удалось отправить ответ"));
    } finally {
      setBusy(false);
    }
  };

  const { vacancy, company } = invitation;

  return (
    <div className="card">
      <div className="row-between">
        <h3>{vacancy.vac_title}</h3>
        <StatusBadge map={INVITATION_STATUS} status={invitation.status} />
      </div>
      <p className="muted">
        {company.comp_name} · {vacancy.vac_region || "регион не указан"} ·{" "}
        {formatSalary(vacancy.salary) || "зарплата не указана"}
      </p>
      {invitation.message && <p>«{invitation.message}»</p>}
      <p className="muted">Получено {formatDate(invitation.created_at)}</p>

      {invitation.status === "pending" && !declining && (
        <div className="row">
          <button className="btn-primary" disabled={busy} onClick={() => respond("accept")}>
            Принять
          </button>
          <button disabled={busy} onClick={() => setDeclining(true)}>
            Отклонить
          </button>
          <Link className="btn-small" to={`/vacancy/${invitation.vac_id}`}>
            Открыть вакансию
          </Link>
        </div>
      )}

      {declining && (
        <div className="reason-box stack">
          <label>Причина (увидит работодатель)</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Не указывать</option>
            {DECLINE_REASONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="row">
            <button className="btn-danger" disabled={busy} onClick={() => respond("reject")}>
              Отклонить приглашение
            </button>
            <button onClick={() => setDeclining(false)}>Назад</button>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function SentCard({ invitation, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const cancel = async () => {
    setBusy(true);
    try {
      onChange(await invitationService.cancel(invitation.inv_id));
    } catch (err) {
      setError(apiError(err, "Не удалось отозвать приглашение"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="row-between">
        <h3>{invitation.resume.res_title}</h3>
        <StatusBadge map={INVITATION_STATUS} status={invitation.status} />
      </div>
      <p className="muted">
        На вакансию «{invitation.vacancy.vac_title}» · отправлено {formatDate(invitation.created_at)}
      </p>
      {invitation.decline_reason && (
        <div className="reason-box">Причина отказа: {invitation.decline_reason}</div>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <Link className="btn-small" to={`/resume/${invitation.res_id}`} state={{ vacancyId: invitation.vac_id }}>
          Резюме
        </Link>
        {invitation.status === "pending" && (
          <button className="btn-small danger" disabled={busy} onClick={cancel}>
            Отозвать
          </button>
        )}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default function InvitationsPage() {
  const { user } = useAuth();
  const isCandidate = user.role === "candidate";
  const { data, setData, loading, error } = useLoad(async () => {
    if (isCandidate) {
      await invitationService.markReceivedViewed();
      return invitationService.received();
    }
    return invitationService.sent();
  }, [isCandidate]);
  const [tab, setTab] = useState("pending");

  const items = data || [];
  const visible = items.filter((i) => (tab === "pending" ? i.status === "pending" : i.status !== "pending"));
  const replace = (updated) =>
    setData(items.map((i) => (i.inv_id === updated.inv_id ? { ...i, ...updated } : i)));
  const Card = isCandidate ? ReceivedCard : SentCard;

  return (
    <div className="auth-container">
      <h1>{isCandidate ? "Приглашения от работодателей" : "Отправленные приглашения"}</h1>

      <div className="tabs">
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
          Ждут ответа ({items.filter((i) => i.status === "pending").length})
        </button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>
          История
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загрузка…</p>}
      {!loading && visible.length === 0 && (
        <div className="empty">
          {tab === "pending"
            ? isCandidate
              ? "Новых приглашений нет."
              : "Нет приглашений, ожидающих ответа. Найдите кандидата в разделе «Кандидаты»."
            : "История пока пуста."}
        </div>
      )}
      {visible.map((invitation) => (
        <Card key={invitation.inv_id} invitation={invitation} onChange={replace} />
      ))}
    </div>
  );
}
