"use client";

import { FormEvent, useEffect, useState } from "react";
import { extractApiError } from "@/shared/auth/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { usersApi, userDisplayName } from "@/entities/user/api";
import type { AdminUser } from "@/entities/user/types";

interface BlockUserModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onDone: (updated: AdminUser) => void;
}

export function BlockUserModal({ user, onClose, onDone }: BlockUserModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setReason("");
      setErr(null);
    }
  }, [user?.id]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setErr(null);
    try {
      const updated = await usersApi.block(user.id, reason.trim() || undefined);
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
      title="Foydalanuvchini bloklash"
      description={user ? userDisplayName(user) : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </Button>
          <Button variant="danger" onClick={onSubmit} loading={submitting}>
            Bloklash
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">
          Bloklangan foydalanuvchi tizimga kira olmaydi va barcha aktiv sessiyalari yopiladi.
        </p>
        <Input
          label="Sabab (ixtiyoriy)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Masalan: ko'p marta buyurtma bekor qilingan"
          hint="Audit logda saqlanadi."
        />
        {err ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
