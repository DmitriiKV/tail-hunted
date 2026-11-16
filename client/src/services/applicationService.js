import api from "../api/client";

export const createApplication = (vac_id) => {
  return api.post("/applications", { vac_id });
};

export const getMyApplications = () => {
  return api.get("/applications/my");
};

export const getVacancyApplications = (vac_id) => {
  return api.get(`/applications/vacancy/${vac_id}`);
};

export const updateApplicationStatus = (app_id, status) => {
  return api.patch(`/applications/${app_id}/status`, { status });
};

export const getApplicationResume = (app_id) =>
  api.get(`/applications/${app_id}/resume`);