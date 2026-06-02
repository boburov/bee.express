/** Mirrors server Notification rows returned by /notifications/mine. */
export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "DANGER"
  | "ANNOUNCE";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  data: unknown;
  groupId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResult {
  items: AppNotification[];
  total: number;
  unread: number;
  page: number;
  pageSize: number;
}

export interface ToastItem {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  link: string | null;
}

/** Pull the in-app deep link (e.g. "/orders/123") out of a notification's data. */
export function notificationLink(data: unknown): string | null {
  if (data && typeof data === "object" && "link" in data) {
    const l = (data as { link?: unknown }).link;
    return typeof l === "string" ? l : null;
  }
  return null;
}
