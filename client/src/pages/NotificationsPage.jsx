import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLoad } from "../hooks/useLoad";
import { timeAgo } from "../utils/format";
import { notificationService } from "../services/notificationService";

function targetOf(notification, role) {
  const { notification_type: type, vac_id: vacId } = notification;
  if (type.startsWith("invitation")) return "/invitations";
  if (type === "new_application" && vacId) return `/vacancy/${vacId}/applications`;
  if (type.startsWith("application")) return "/my-applications";
  if (type === "contact_request") return "/";
  if (type === "contact_response" && role === "employer") return "/resumes";
  return null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, setData, loading, error } = useLoad(() => notificationService.list());
  const items = data || [];
  const unread = items.filter((n) => !n.is_read).length;

  const open = async (notification) => {
    if (!notification.is_read) {
      notificationService.markRead(notification.notification_id).catch(() => {});
      setData(items.map((n) => (n === notification ? { ...n, is_read: true } : n)));
    }
    const target = targetOf(notification, user.role);
    if (target) navigate(target);
  };

  const readAll = async () => {
    await notificationService.markAllRead();
    setData(items.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="auth-container">
      <div className="row-between">
        <h1>Уведомления</h1>
        {unread > 0 && (
          <button className="btn-small" onClick={readAll}>
            Отметить все прочитанными
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Загрузка…</p>}
      {!loading && !error && items.length === 0 && (
        <div className="empty">Пока ничего нового. Здесь появятся отклики, приглашения и ответы.</div>
      )}

      {items.length > 0 && (
        <div className="list">
          {items.map((n) => (
            <div
              key={n.notification_id}
              role="button"
              tabIndex={0}
              className={`notification ${n.is_read ? "" : "unread"}`}
              onClick={() => open(n)}
              onKeyDown={(e) => e.key === "Enter" && open(n)}
            >
              <span className="notification-dot" />
              <div>
                <strong>{n.title}</strong>
                <div>{n.message}</div>
                <span className="muted">{timeAgo(n.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
