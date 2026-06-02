import { api } from "@/lib/api";
import type { AppNotification, NotificationsListResult } from "./types";

export const notificationsApi = {
  listMine: (params: { page?: number; pageSize?: number } = {}) =>
    api
      .get<NotificationsListResult>("/notifications/mine", { params })
      .then((r) => r.data),
  unreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count").then((r) => r.data),
  markRead: (id: string) =>
    api.patch<AppNotification>(`/notifications/${id}/read`, {}).then((r) => r.data),
  markAllRead: () =>
    api.post<{ updated: number }>("/notifications/read-all", {}).then((r) => r.data),
};
