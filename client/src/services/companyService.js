import api from "../api/client";

export const companyService = {
  create: (data) => api.post("/companies", data).then((r) => r.data),
  getMy: () => api.get("/companies/my").then((r) => r.data),
  update: (data) => api.patch("/companies/my", data).then((r) => r.data),
};