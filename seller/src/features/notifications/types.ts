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
}
