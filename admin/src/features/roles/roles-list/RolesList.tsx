"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { extractApiError } from "@/shared/auth/api";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { rolesApi } from "@/entities/role/api";
import type { Role } from "@/entities/role/types";
import { RoleFormModal } from "@/features/roles/role-form/RoleFormModal";

export function RolesList() {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRoles(await rolesApi.list());
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function onCreateClick() {
    setEditing(null);
    setModalOpen(true);
  }

  function onEditClick(role: Role) {
    setEditing(role);
    setModalOpen(true);
  }

  async function onDelete(role: Role) {
    if (role.isSystem) return;
    if (
      !confirm(
        `"${role.name}" rolini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.`,
      )
    ) {
      return;
    }
    try {
      await rolesApi.remove(role.id);
      refresh();
    } catch (e) {
      alert(extractApiError(e));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button onClick={onCreateClick} leftIcon={<Plus className="h-4 w-4" />}>
          Yangi rol
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !roles ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : roles && roles.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Hech qanday rol yo'q"
          description="Birinchi rolingizni yarating va keyin foydalanuvchilarga biriktiring."
          action={
            <Button onClick={onCreateClick} leftIcon={<Plus className="h-4 w-4" />}>
              Birinchi rolni yaratish
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles?.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => onEditClick(role)}
              onDelete={() => onDelete(role)}
            />
          ))}
        </div>
      )}

      <RoleFormModal
        open={modalOpen}
        role={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          refresh();
        }}
      />
    </div>
  );
}

interface RoleCardProps {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}

function RoleCard({ role, onEdit, onDelete }: RoleCardProps) {
  const permCount = role.permissions.length;
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-ink truncate">{role.name}</h3>
              {role.isSystem ? (
                <Badge tone="brand" size="sm">
                  <Lock className="h-3 w-3" /> Tizim
                </Badge>
              ) : null}
            </div>
            <div className="text-[11px] font-mono text-ink-muted mt-0.5">{role.slug}</div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3 hover:text-ink"
              aria-label="Tahrirlash"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {!role.isSystem ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-red-50 hover:text-red-700"
                aria-label="O'chirish"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        {role.description ? (
          <p className="text-sm text-ink-muted mt-2 line-clamp-3">{role.description}</p>
        ) : null}

        <div className="mt-4 flex items-center justify-between text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {role.userCount} foydalanuvchi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            {permCount} ruxsat
          </span>
        </div>

        {permCount > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {role.permissions.slice(0, 4).map((p) => (
              <Badge key={p} size="sm" tone="neutral">
                {p}
              </Badge>
            ))}
            {permCount > 4 ? (
              <Badge size="sm" tone="neutral">
                +{permCount - 4}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
