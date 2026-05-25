import { api } from "@/shared/auth/api";
import type { CreateRoleInput, Role, UpdateRoleInput } from "./types";

export const rolesApi = {
  list: () => api.get<Role[]>("/admin/roles").then((r) => r.data),
  get: (id: string) => api.get<Role>(`/admin/roles/${id}`).then((r) => r.data),
  create: (data: CreateRoleInput) =>
    api.post<Role>("/admin/roles", data).then((r) => r.data),
  update: (id: string, data: UpdateRoleInput) =>
    api.patch<Role>(`/admin/roles/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/roles/${id}`),
};

/**
 * Default permission catalog. Used by the create/edit Role form to render
 * a checklist instead of a free-text field. Adding a new permission here is
 * the only change needed for it to appear in the UI.
 */
export const PERMISSION_CATALOG: { group: string; items: { slug: string; label: string }[] }[] = [
  {
    group: "Foydalanuvchilar",
    items: [
      { slug: "user.read", label: "Ko'rish" },
      { slug: "user.block", label: "Bloklash/tiklash" },
      { slug: "user.role.assign", label: "Rol biriktirish" },
    ],
  },
  {
    group: "Katalog",
    items: [
      { slug: "catalog.read", label: "Ko'rish" },
      { slug: "catalog.write", label: "Tahrirlash" },
      { slug: "catalog.moderate", label: "Moderatsiya" },
    ],
  },
  {
    group: "Buyurtmalar",
    items: [
      { slug: "order.read", label: "Ko'rish" },
      { slug: "order.intervene", label: "Aralashish" },
    ],
  },
  {
    group: "Moliya",
    items: [
      { slug: "finance.read", label: "Ko'rish" },
      { slug: "finance.payout", label: "To'lov" },
    ],
  },
  {
    group: "Tizim",
    items: [
      { slug: "audit.read", label: "Audit log" },
      { slug: "role.manage", label: "Rollarni boshqarish" },
      { slug: "settings.manage", label: "Sozlamalar" },
    ],
  },
];
