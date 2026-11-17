import api from "../api/client";

export const resumeService = {
  create: (data) => api.post("/resumes", data).then((r) => r.data),

  getMy: () => api.get("/resumes/my").then((r) => r.data),

  update: (resId, data) =>
    api.patch(`/resumes/${resId}`, data).then((r) => r.data),

  listAll: (params = {}) =>
    api.get("/resumes", { params }).then((r) => r.data),

  // Получить подробное резюме
  getById: (resId) =>
    api.get(`/resumes/${resId}`).then((r) => r.data),

  // Запросить доступ к email кандидата
  requestContacts: (resId) =>
    api.post(`/resumes/${resId}/contact-request`).then((r) => r.data),

  // Получить запросы на контакты (для кандидата)
  getContactRequests: () =>
    api.get("/resumes/contact-requests").then((r) => r.data),

  // Одобрить или отклонить запрос
  respondToContactRequest: (requestId, status) =>
    api.patch(`/resumes/contact-requests/${requestId}`, { status })
      .then((r) => r.data),
};