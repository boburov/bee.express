export type RealtimeNotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "DANGER"
  | "ANNOUNCE";

/** Mirrors `server/src/notifications/types.ts` — keep field-for-field. */
export interface RealtimeNotification {
  id: string;
  title: string;
  body: string | null;
  type: RealtimeNotificationType;
  data: unknown;
  groupId: string | null;
  createdAt: string;
}

export const RealtimeEvents = {
  New: "notification:new",
  UnreadCount: "notification:unread_count",
  MarkRead: "notification:mark_read",
} as const;
