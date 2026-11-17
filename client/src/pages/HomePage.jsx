
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

import { companyService } from "../services/companyService";
import { resumeService } from "../services/resumeService";
import { vacancyService } from "../services/vacancyService";

import {
  getMyApplications,
  getVacancyApplications,
} from "../services/applicationService";

import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

const statusLabels = {
  pending: "Ожидает рассмотрения",
  viewed: "Просмотрено",
  invited: "Приглашение",
  rejected: "Отказ",
};

const statusColors = {
  pending: { background: "#fff3cd", color: "#856404" },
  viewed: { background: "#eaf2ff", color: "#2457a7" },
  invited: { background: "#d1e7dd", color: "#0f5132" },
  rejected: { background: "#f8d7da", color: "#842029" },
};

// Приветствие в зависимости от времени суток
const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Доброе утро";
  if (hour >= 12 && hour < 18) return "Добрый день";
  if (hour >= 18 && hour < 23) return "Добрый вечер";

  return "Доброй ночи";
};

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [greeting, setGreeting] = useState(getGreeting);

  const [company, setCompany] = useState(null);
  const [resume, setResume] = useState(null);

  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");

  const [vacancies, setVacancies] = useState([]);
  const [vacanciesLoading, setVacanciesLoading] = useState(false);
  const [vacanciesError, setVacanciesError] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const [contactRequests, setContactRequests] = useState([]);
  const [contactRequestError, setContactRequestError] = useState("");
  const [contactRequestLoadingId, setContactRequestLoadingId] = useState(null);

  // Обновляем приветствие раз в минуту
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting());
    };

    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user) return;

    if (user.role === "employer") {
      companyService
        .getMy()
        .then(setCompany)
        .catch(() => setCompany(null));

      loadEmployerVacancies();
    }

    if (user.role === "candidate") {
      resumeService
        .getMy()
        .then((list) => setResume(list[0] || null))
        .catch(() => setResume(null));

      loadCandidateApplications();
      loadContactRequests();
    }

    loadNotifications();
  }, [user]);

  // Загрузка откликов кандидата
  const loadCandidateApplications = async () => {
    try {
      setApplicationsLoading(true);
      setApplicationsError("");

      const response = await getMyApplications();
      const items = response.data.applications || [];

      items.sort(
        (a, b) =>
          new Date(b.app_created_at) - new Date(a.app_created_at)
      );

      setApplications(items);
    } catch (error) {
      setApplicationsError(
        error.response?.data?.error || "Не удалось загрузить отклики"
      );
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Загрузка вакансий работодателя и подсчёт откликов
  const loadEmployerVacancies = async () => {
    try {
      setVacanciesLoading(true);
      setVacanciesError("");

      const myVacancies = await vacancyService.getMy();

      const vacanciesWithCounts = await Promise.all(
        myVacancies.map(async (vacancy) => {
          try {
            const response = await getVacancyApplications(vacancy.vac_id);

            return {
              ...vacancy,
              applicationsCount: (
                response.data.applications || []
              ).length,
            };
          } catch (error) {
            console.error(
              `Ошибка загрузки откликов вакансии ${vacancy.vac_id}:`,
              error
            );

            return {
              ...vacancy,
              applicationsCount: null,
            };
          }
        })
      );

      setVacancies(vacanciesWithCounts);
    } catch (error) {
      setVacanciesError(
        error.response?.data?.error || "Не удалось загрузить вакансии"
      );
    } finally {
      setVacanciesLoading(false);
    }
  };

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

  const invitedCount = applications.filter(
    (item) => item.status === "invited"
  ).length;

  const pendingCount = applications.filter(
    (item) => item.status === "pending"
  ).length;

  const totalEmployerApplications = vacancies.reduce(
    (sum, vacancy) =>
      sum + (vacancy.applicationsCount ?? 0),
    0
  );

  const pendingContactRequests = contactRequests.filter(
    (item) => item.status === "pending"
  ).length;

  return (
    <div className="auth-container" style={{ maxWidth: 850 }}>
      {/* ПРИВЕТСТВИЕ */}
      <h1>
        {greeting}
        {user?.first_name ? `, ${user.first_name}` : ""}!
      </h1>

      <p className="info-sub" style={{ marginBottom: 24 }}>
        Рады видеть вас в личном кабинете.
      </p>

      {/* РЕЗЮМЕ КАНДИДАТА */}
      {user?.role === "candidate" && (
        <div className="info-card">
          <div className="info-label">Моё резюме</div>

          {resume ? (
            <>
              <div className="info-value">{resume.res_title}</div>

              {resume.skills && (
                <div className="info-sub">{resume.skills}</div>
              )}

              <div style={{ marginTop: 14 }}>
                <Link to="/resume" className="btn-primary">
                  Редактировать резюме
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="info-sub">
                Резюме ещё не создано. Создайте его, чтобы работодатели
                могли найти вас.
              </div>

              <Link
                to="/resume"
                className="btn-primary"
                style={{ display: "inline-block", marginTop: 12 }}
              >
                Создать резюме
              </Link>
            </>
          )}
        </div>
      )}

      {/* ИНФОРМАЦИЯ О КОМПАНИИ РАБОТОДАТЕЛЯ */}
      {user?.role === "employer" && (
        <div className="info-card">
          <div className="info-label">Моя компания</div>

          {company ? (
            <>
              <div className="info-value">{company.comp_name}</div>

              {company.comp_region && (
                <div className="info-sub">{company.comp_region}</div>
              )}

              <div style={{ marginTop: 14 }}>
                <Link to="/company" className="btn-primary">
                  Редактировать компанию
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="info-sub">
                Компания ещё не создана
              </div>

              <Link
                to="/company"
                className="btn-primary"
                style={{ display: "inline-block", marginTop: 12 }}
              >
                Создать компанию
              </Link>
            </>
          )}
        </div>
      )}

      {/* УВЕДОМЛЕНИЯ — ОБЩИЕ ДЛЯ ОБЕИХ РОЛЕЙ */}
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
                  background: notification.is_read ? "#f5f5f5" : "#eaf2ff",
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

      {/* ЗАПРОСЫ НА ДОСТУП К КОНТАКТАМ — КАНДИДАТ */}
      {user?.role === "candidate" && (
        <div className="info-card" style={{ marginTop: 20 }}>
          <h2 style={{ marginTop: 0 }}>
            Запросы на доступ к контактам

            {pendingContactRequests > 0 && (
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
                {pendingContactRequests}
              </span>
            )}
          </h2>

          {contactRequestError && (
            <p className="error">{contactRequestError}</p>
          )}

          {contactRequests.length === 0 ? (
            <p className="info-sub">
              Пока нет запросов на доступ к вашим контактам.
            </p>
          ) : (
            contactRequests.map((request) => (
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
                <strong>
                  {request.company_name || request.employer_name}
                </strong>

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
            ))
          )}
        </div>
      )}

      {/* МОИ ОТКЛИКИ — КАНДИДАТ */}
      {user?.role === "candidate" && (
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
              Мои отклики ({applications.length})
            </h2>

            <button
              className="btn-secondary"
              onClick={loadCandidateApplications}
              disabled={applicationsLoading}
            >
              {applicationsLoading ? "Загрузка..." : "Обновить"}
            </button>
          </div>

          {!applicationsError && (
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                margin: "16px 0",
              }}
            >
              <div className="info-sub">
                Ожидают ответа: <strong>{pendingCount}</strong>
              </div>

              <div className="info-sub">
                Приглашения: <strong>{invitedCount}</strong>
              </div>
            </div>
          )}

          {applicationsError && (
            <p className="error">{applicationsError}</p>
          )}

          {applicationsLoading && applications.length === 0 && (
            <p>Загрузка откликов...</p>
          )}

          {!applicationsLoading &&
            !applicationsError &&
            applications.length === 0 && (
              <p className="info-sub">
                Вы пока не откликались на вакансии.
              </p>
            )}

          {applications.map((application) => {
            const statusStyle =
              statusColors[application.status] || statusColors.pending;

            return (
              <div
                key={application.app_id}
                className="vacancy-card"
                style={{ marginTop: 14 }}
              >
                <div className="vacancy-card-body">
                  <h3>
                    {application.vacancy?.vac_title || "Вакансия"}
                  </h3>

                  <p style={{ color: "#667085" }}>
                    Компания:{" "}
                    {application.company?.comp_name || "Не указана"}
                  </p>

                  <p style={{ color: "#667085" }}>
                    Регион:{" "}
                    {application.vacancy?.vac_region || "Не указан"}
                  </p>

                  <p>
                    Статус:{" "}
                    <span
                      style={{
                        ...statusStyle,
                        display: "inline-block",
                        padding: "5px 10px",
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {statusLabels[application.status] ||
                        application.status}
                    </span>
                  </p>

                  <small style={{ color: "#667085" }}>
                    Дата отклика:{" "}
                    {application.app_created_at
                      ? new Date(
                          application.app_created_at
                        ).toLocaleDateString("ru-RU")
                      : "Не указана"}
                  </small>

                  <div style={{ marginTop: 12 }}>
                    <Link
                      to={`/vacancy/${application.vac_id}`}
                      className="btn-small"
                    >
                      Открыть вакансию
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: 16 }}>
            <Link to="/vacancies" className="btn-primary">
              Смотреть вакансии
            </Link>
          </div>
        </div>
      )}

      {/* МОИ ВАКАНСИИ — РАБОТОДАТЕЛЬ */}
      {user?.role === "employer" && (
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
              Мои вакансии ({vacancies.length})
            </h2>

            <button
              className="btn-secondary"
              onClick={loadEmployerVacancies}
              disabled={vacanciesLoading}
            >
              {vacanciesLoading ? "Загрузка..." : "Обновить"}
            </button>
          </div>

          {!vacanciesError && (
            <p className="info-sub">
              Всего откликов: <strong>{totalEmployerApplications}</strong>
            </p>
          )}

          {vacanciesError && (
            <p className="error">{vacanciesError}</p>
          )}

          {vacanciesLoading && vacancies.length === 0 && (
            <p>Загрузка вакансий...</p>
          )}

          {!vacanciesLoading &&
            !vacanciesError &&
            vacancies.length === 0 && (
              <p className="info-sub">
                У вас пока нет вакансий.
              </p>
            )}

          {vacancies.map((vacancy) => (
            <div
              key={vacancy.vac_id}
              className="vacancy-card"
              style={{ marginTop: 14 }}
            >
              <div className="vacancy-card-body">
                <h3>{vacancy.vac_title}</h3>

                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#4f46e5",
                    fontWeight: 500,
                  }}
                >
                  {vacancy.salary
                    ? `${vacancy.salary} ₽`
                    : "Зарплата не указана"}
                </p>

                <p style={{ color: "#667085", fontSize: 13 }}>
                  {vacancy.vac_region} · {vacancy.employment_type}
                </p>

                <p style={{ marginBottom: 0 }}>
                  Отклики:{" "}
                  <strong>
                    {vacancy.applicationsCount === null
                      ? "Не удалось загрузить"
                      : vacancy.applicationsCount}
                  </strong>
                </p>
              </div>

              <div className="vacancy-card-actions">
                <Link
                  to={`/vacancy/${vacancy.vac_id}/edit`}
                  className="btn-small"
                >
                  Редактировать
                </Link>

                <Link
                  to={`/vacancy/${vacancy.vac_id}/applications`}
                  className="btn-small"
                >
                  Посмотреть отклики
                </Link>
              </div>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <Link to="/vacancy/new" className="btn-primary">
              + Создать вакансию
            </Link>

            <Link to="/resumes" className="btn-secondary">
              Смотреть резюме
            </Link>
          </div>
        </div>
      )}

      {/* ВЫХОД */}
      <button
        onClick={handleLogout}
        className="btn-logout"
        style={{ marginTop: 20 }}
      >
        Выйти
      </button>
    </div>
  );
}
