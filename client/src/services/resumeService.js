
import api from "../api/client";

export const resumeService = {
  create: (data) => api.post("/resumes", data).then((r) => r.data),

  getMy: () => api.get("/resumes/my").then((r) => r.data),

  update: (resId, data) =>
    api.patch(`/resumes/${resId}`, data).then((r) => r.data),

  listAll: (params = {}) =>
    api.get("/resumes", { params }).then((r) => r.data),
};
