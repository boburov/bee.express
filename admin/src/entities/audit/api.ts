import { api } from "@/shared/auth/api";
import type { AuditListResponse, ListAuditQuery } from "./types";

export const auditApi = {
  list: (query: ListAuditQuery = {}) =>
    api
      .get<AuditListResponse>("/admin/audit", { params: query })
      .then((r) => r.data),
};

/**
 * Human-readable label for an action key. New keys can be added safely; unknown
 * keys fall back to the raw slug so we never block a deploy on a missing label.
 */
const ACTION_LABELS: Record<string, string> = {
  "auth.login.phone": "Telefon orqali kirish",
  "auth.login.miniapp": "Mini App orqali kirish",
  "auth.login.superadmin": "Super Admin kirishi",
  "user.block": "Foydalanuvchi bloklandi",
  "user.unblock": "Foydalanuvchi blokdan chiqarildi",
  "user.role.assign": "Foydalanuvchi roli o'zgartirildi",
  "role.create": "Rol yaratildi",
  "role.update": "Rol tahrirlandi",
  "role.delete": "Rol o'chirildi",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}
