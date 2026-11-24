import api from "../api/client";

export const invitationService = {
  create: (data) => api.post("/invitations", data).then((r) => r.data),
  sent: () => api.get("/invitations/sent").then((r) => r.data.invitations),
  received: () => api.get("/invitations/received").then((r) => r.data.invitations),
  markReceivedViewed: () => api.patch("/invitations/received/mark-viewed").then((r) => r.data),
  respond: (id, decision, reason) =>
    api.patch(`/invitations/${id}/respond`, { decision, reason }).then((r) => r.data),
  cancel: (id) => api.patch(`/invitations/${id}/cancel`).then((r) => r.data),
};
