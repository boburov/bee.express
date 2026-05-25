export interface AdminUser {
  id: string;
  phone: string | null;
  telegramId: string | null;
  telegramUsername: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: { id: string; slug: string; name: string } | null;
  isBlocked: boolean;
  blockedAt: string | null;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListUsersQuery {
  roleSlug?: string;
  isBlocked?: boolean;
  q?: string;
  page?: number;
  pageSize?: number;
}
