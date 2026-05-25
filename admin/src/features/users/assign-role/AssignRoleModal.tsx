"use client";

import { FormEvent, useEffect, useState } from "react";
import { extractApiError } from "@/shared/auth/api";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";
import { Spinner } from "@/shared/ui/Spinner";
import { usersApi, userDisplayName } from "@/entities/user/api";
import type { AdminUser } from "@/entities/user/types";
import { rolesApi } from "@/entities/role/api";
import type { Role } from "@/entities/role/types";

interface AssignRoleModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onDone: (updated: AdminUser) => void;
}

export function AssignRoleModal({ user, onClose, onDone }: AssignRoleModalProps) {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [roleId, setRoleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setRoleId(user.role?.id ?? "");
    setErr(null);

    let cancelled = false;
    setLoading(true);
    rolesApi
      .list()
      .then((rs) => {
        if (!cancelled) setRoles(rs);
      })
      .catch((e) => {
        if (!cancelled) setErr(extractApiError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setErr(null);
    try {
      const updated = await usersApi.assignRole(user.id, roleId || null);
      onDone(updated);
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      title="Rolni o'zgartirish"
      description={user ? userDisplayName(user) : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={submitting} disabled={loading}>
            Saqlash
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <>
            <Select
              label="Rol"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              hint="Bo'sh — foydalanuvchidan rol olib tashlanadi (oddiy xaridor)."
            >
              <option value="">Rolsiz (xaridor)</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.isSystem ? " · tizim" : ""}
                </option>
              ))}
            </Select>
            <p className="text-xs text-ink-muted">
              Rol biriktirish foydalanuvchining tizimdagi ruxsatlarini o&apos;zgartiradi.
              O&apos;zgarish darhol kuchga kiradi (yangi token chiqarilganda).
            </p>
          </>
        )}
        {err ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
