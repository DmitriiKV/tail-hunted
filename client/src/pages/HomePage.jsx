import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { companyService } from "../services/companyService";
import { resumeService } from "../services/resumeService";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [resume, setResume] = useState(null);

  // Уведомления
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  // Запросы доступа к контактам
  const [contactRequests, setContactRequests] = useState([]);
  const [contactRequestError, setContactRequestError] = useState("");
  const [contactRequestLoadingId, setContactRequestLoadingId] = useState(null);

  // Загрузка данных пользователя
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

      loadContactRequests();
    }

    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Загрузка уведомлений
  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const response = await getNotifications();
      const data = response.data;

      const list = Array.isArray(data)
        ? data
        : data.notifications || [];

      setNotifications(list);
      setUnreadCount(list.filter((item) => !item.is_read).length);
    } catch (error) {
      console.error("Ошибка загрузки уведомлений:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Загрузка запросов на доступ к контактам
  const loadContactRequests = async () => {
    try {
      setContactRequestError("");

      const data = await resumeService.getContactRequests();
      setContactRequests(data.requests || []);
    } catch (error) {
      console.error("Ошибка загрузки запросов:", error);
      setContactRequestError(
        "Не удалось загрузить запросы на доступ к контактам"
      );
    }
  };

  // Ответ кандидата на запрос работодателя
  const handleContactRequestResponse = async (requestId, status) => {
    try {
      setContactRequestLoadingId(requestId);
      setContactRequestError("");

      await resumeService.respondToContactRequest(requestId, status);

      setContactRequests((prev) =>
        prev.map((item) =>
          item.request_id === requestId
            ? { ...item, status }
            : item
        )
      );

      await loadNotifications();
    } catch (error) {
      console.error("Ошибка обработки запроса:", error);

      setContactRequestError(
        error.response?.data?.error || "Не удалось обработать запрос"
      );
    } finally {
      setContactRequestLoadingId(null);
    }
  };

  // Прочитать одно уведомление
  const handleReadNotification = async (id) => {
    try {
      await markNotificationRead(id);

      setNotifications((prev) =>
        prev.map((item) =>
          item.notification_id === id
            ? { ...item, is_read: true }
            : item
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Ошибка обновления уведомления:", error);
    }
  };

  // Прочитать все уведомления
  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();

      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Ошибка обновления уведомлений:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="auth-container">
      <h1>
        Привет, {user?.first_name} {user?.last_name}!
      </h1>

      {/* Информация о компании */}
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

      {/* Информация о резюме */}
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

      {/* Уведомления */}
      <div className="info-card" style={{ marginTop: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>
            Уведомления
            {unreadCount > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  background: "#dc3545",
                  color: "white",
                  borderRadius: 20,
                  padding: "3px 9px",
                  fontSize: 13,
                }}
              >
                {unreadCount}
              </span>
            )}
          </h2>

          {unreadCount > 0 && (
            <button
              onClick={handleReadAll}
              className="btn-secondary"
              style={{ fontSize: 13 }}
            >
              Прочитать все
            </button>
          )}
        </div>

        {notificationsLoading ? (
          <p>Загрузка уведомлений...</p>
        ) : notifications.length === 0 ? (
          <p className="info-sub">У вас пока нет уведомлений</p>
        ) : (
          <div style={{ marginTop: 15 }}>
            {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                  background: notification.is_read
                    ? "#f5f5f5"
                    : "#eaf2ff",
                  borderLeft: notification.is_read
                    ? "3px solid #ccc"
                    : "3px solid #3478db",
                }}
              >
                <div style={{ fontWeight: "bold" }}>
                  {notification.title}
                </div>

                <p style={{ margin: "6px 0" }}>
                  {notification.message}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <small style={{ color: "#777" }}>
                    {new Date(notification.created_at).toLocaleString("ru-RU")}
                  </small>

                  {!notification.is_read && (
                    <button
                      onClick={() =>
                        handleReadNotification(
                          notification.notification_id
                        )
                      }
                      className="btn-secondary"
                      style={{ fontSize: 12 }}
                    >
                      Прочитать
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Запросы работодателей на доступ к контактам */}
      {user?.role === "candidate" && (
        <div className="info-card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>
            Запросы на доступ к контактам
          </h2>

          {contactRequestError && (
            <p style={{ color: "#dc3545" }}>
              {contactRequestError}
            </p>
          )}

          {contactRequests.length === 0 ? (
            <p className="info-sub">
              Пока нет запросов на доступ к вашим контактам
            </p>
          ) : (
            <div style={{ marginTop: 15 }}>
              {contactRequests.map((request) => (
                <div
                  key={request.request_id}
                  style={{
                    padding: 14,
                    marginBottom: 12,
                    borderRadius: 8,
                    background: "#f5f5f5",
                    borderLeft: "3px solid #3478db",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    {request.company_name || request.employer_name}
                  </div>

                  {request.company_name && (
                    <div style={{ marginTop: 4 }}>
                      Работодатель: {request.employer_name}
                    </div>
                  )}

                  <p style={{ margin: "6px 0" }}>
                    Запрос для резюме: {request.resume_title}
                  </p>

                  <small style={{ color: "#777" }}>
                    {new Date(request.created_at).toLocaleString("ru-RU")}
                  </small>

                  {request.status === "pending" ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        marginTop: 12,
                      }}
                    >
                      <button
                        onClick={() =>
                          handleContactRequestResponse(
                            request.request_id,
                            "approved"
                          )
                        }
                        disabled={
                          contactRequestLoadingId === request.request_id
                        }
                        className="btn-primary"
                      >
                        {contactRequestLoadingId === request.request_id
                          ? "Обработка..."
                          : "Разрешить"}
                      </button>

                      <button
                        onClick={() =>
                          handleContactRequestResponse(
                            request.request_id,
                            "rejected"
                          )
                        }
                        disabled={
                          contactRequestLoadingId === request.request_id
                        }
                        className="btn-secondary"
                      >
                        Отклонить
                      </button>
                    </div>
                  ) : (
                    <p
                      style={{
                        marginBottom: 0,
                        marginTop: 10,
                        fontWeight: "bold",
                        color:
                          request.status === "approved"
                            ? "#198754"
                            : "#dc3545",
                      }}
                    >
                      {request.status === "approved"
                        ? "Вы разрешили доступ к контактам"
                        : "Вы отклонили запрос"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Основные действия */}
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
