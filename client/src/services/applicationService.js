import api from "../api/client";

export const applicationService = {
  create: (vac_id) => api.post("/applications", { vac_id }).then((r) => r.data),
  mine: () => api.get("/applications/my").then((r) => r.data.applications),
  cancel: (app_id) => api.delete(`/applications/${app_id}`).then((r) => r.data),
  forVacancy: (vac_id) =>
    api.get(`/applications/vacancy/${vac_id}`).then((r) => r.data.applications),
  setStatus: (app_id, status) =>
    api.patch(`/applications/${app_id}/status`, { status }).then((r) => r.data),
  resume: (app_id) => api.get(`/applications/${app_id}/resume`).then((r) => r.data),
};
