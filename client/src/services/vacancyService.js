
import api from "../api/client";

export const vacancyService = {
  create: (data) => api.post("/vacancies", data).then((r) => r.data),

  // Получение вакансий с возможностью поиска и фильтрации
  listAll: (params = {}) =>
    api.get("/vacancies", { params }).then((r) => r.data),

  getMy: () => api.get("/vacancies/my").then((r) => r.data),

  getById: (id) => api.get(`/vacancies/${id}`).then((r) => r.data),

  update: (id, data) =>
    api.patch(`/vacancies/${id}`, data).then((r) => r.data),

  remove: (id) => api.delete(`/vacancies/${id}`).then((r) => r.data),
};
