import { api } from "@/shared/auth/api";
import type {
  NotificationGroup,
  SendNotificationPayload,
  SendNotificationResult,
} from "./types";

export const notificationsApi = {
  send: (payload: SendNotificationPayload) =>
    api.post<SendNotificationResult>("/admin/notifications", payload).then((r) => r.data),

  history: (page = 1, pageSize = 20) =>
    api
      .get<{ items: NotificationGroup[]; page: number; pageSize: number }>(
        "/admin/notifications",
        { params: { page, pageSize } },
      )
      .then((r) => r.data),
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  INFO: "Ma'lumot",
  SUCCESS: "Muvaffaqiyat",
  WARNING: "Ogohlantirish",
  DANGER: "Muhim",
  ANNOUNCE: "E'lon",
};
