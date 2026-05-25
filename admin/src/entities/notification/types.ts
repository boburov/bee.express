export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'ANNOUNCE';
export type NotificationTarget = 'USER' | 'ROLE' | 'BROADCAST';
export type NotificationSenderType = 'SUPER_ADMIN' | 'USER' | 'SYSTEM';

export interface SendNotificationPayload {
  target: NotificationTarget;
  userIds?: string[];
  roleSlug?: string;
  title: string;
  body?: string;
  type?: NotificationType;
  data?: Record<string, unknown>;
}

export interface NotificationGroup {
  groupId: string;
  title: string;
  body: string | null;
  type: NotificationType;
  senderType: NotificationSenderType;
  senderId: string | null;
  recipients: number;
  deliveredCount: number;
  readCount: number;
  createdAt: string;
}

export interface SendNotificationResult {
  groupId: string;
  recipients: number;
  skipped: number;
}
