import type { NotificationType } from '@prisma/client';

/**
 * Server → client realtime payload. The client decodes this to drive the
 * notification bell and toast.
 */
export interface NotificationPushPayload {
  id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  data: unknown;
  groupId: string | null;
  createdAt: string;
}

/** Socket.IO event names — kept in one place so client/server can't drift. */
export const NotificationEvents = {
  /** Server → client: a new notification just landed for THIS user. */
  New: 'notification:new',
  /** Server → client: unread count changed (after read / mark-all). */
  UnreadCount: 'notification:unread_count',
  /** Client → server: explicit hint that a notification was read. */
  MarkRead: 'notification:mark_read',
} as const;
