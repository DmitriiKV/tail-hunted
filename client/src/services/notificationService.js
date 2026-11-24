import api from "../api/client";

export const notificationService = {
  list: () => api.get("/notifications").then((r) => r.data.notifications),
  unreadCount: () => api.get("/notifications/unread-count").then((r) => r.data.unread_count),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};
