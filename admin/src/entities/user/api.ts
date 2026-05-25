import { api } from "@/shared/auth/api";
import type { AdminUser, AdminUserListResponse, ListUsersQuery } from "./types";

export const usersApi = {
  list: (query: ListUsersQuery = {}) =>
    api
      .get<AdminUserListResponse>("/admin/users", {
        params: {
          roleSlug: query.roleSlug,
          isBlocked:
            query.isBlocked === undefined
              ? undefined
              : query.isBlocked
                ? "true"
                : "false",
          q: query.q,
          page: query.page,
          pageSize: query.pageSize,
        },
      })
      .then((r) => r.data),

  get: (id: string) => api.get<AdminUser>(`/admin/users/${id}`).then((r) => r.data),

  block: (id: string, reason?: string) =>
    api
      .patch<AdminUser>(`/admin/users/${id}/block`, { reason })
      .then((r) => r.data),

  unblock: (id: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/unblock`).then((r) => r.data),

  assignRole: (id: string, roleId: string | null) =>
    api
      .patch<AdminUser>(`/admin/users/${id}/role`, { roleId })
      .then((r) => r.data),
};

export function userDisplayName(user: AdminUser): string {
  const fl = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fl) return fl;
  if (user.telegramUsername) return `@${user.telegramUsername}`;
  if (user.phone) return formatPhone(user.phone);
  return "Foydalanuvchi";
}

export function formatPhone(phone: string): string {
  // 993411786 → +998 99 341 17 86
  if (!phone || phone.length < 9) return phone;
  const last = phone.slice(-9);
  return `+998 ${last.slice(0, 2)} ${last.slice(2, 5)} ${last.slice(5, 7)} ${last.slice(7)}`;
}
