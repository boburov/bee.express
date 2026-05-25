"use client";

import { FormEvent, useEffect, useState } from "react";
import { extractApiError } from "@/shared/auth/api";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { PERMISSION_CATALOG, rolesApi } from "@/entities/role/api";
import type { Role } from "@/entities/role/types";

interface RoleFormModalProps {
  open: boolean;
  role: Role | null; // null = create, present = edit
  onClose: () => void;
  onSaved: (role: Role) => void;
}

export function RoleFormModal({ open, role, onClose, onSaved }: RoleFormModalProps) {
  const isEdit = Boolean(role);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(role?.name ?? "");
    setSlug(role?.slug ?? "");
    setDescription(role?.description ?? "");
    setPermissions(role?.permissions ?? []);
    setErr(null);
  }, [open, role?.id]);

  function togglePermission(slug: string, checked: boolean) {
    setPermissions((prev) =>
      checked ? [...new Set([...prev, slug])] : prev.filter((p) => p !== slug),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErr("Nom kiritilishi shart");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      let saved: Role;
      if (role) {
        saved = await rolesApi.update(role.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissions,
        });
      } else {
        saved = await rolesApi.create({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          permissions,
        });
      }
      onSaved(saved);
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Rolni tahrirlash · ${role!.name}` : "Yangi rol"}
      description={
        isEdit
          ? "Slug o'zgartirilmaydi — kod va auth tokenlar shu identifikator orqali bog'langan."
          : "Yangi rol yaratganingizdan keyin foydalanuvchilarga biriktirishingiz mumkin."
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Bekor qilish
          </Button>
          <Button onClick={onSubmit} loading={submitting} disabled={!name.trim()}>
            {isEdit ? "Saqlash" : "Yaratish"}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nomi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Moderator"
            required
          />
          <Input
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={isEdit ? role!.slug : "moderator — avtomatik yaratiladi"}
            disabled={isEdit}
            hint={isEdit ? undefined : "Faqat lotin harf, raqam, defis. Bo'sh qoldirsangiz avtomatik."}
          />
        </div>
        <Input
          label="Tavsif (ixtiyoriy)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Qisqacha — bu rol nima qila oladi?"
        />

        <div>
          <h4 className="text-sm font-medium text-ink mb-3">Ruxsatlar (permissions)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {PERMISSION_CATALOG.map((group) => (
              <div key={group.group} className="rounded-lg border border-line p-3">
                <div className="text-[11px] uppercase tracking-wider text-ink-muted font-medium mb-2">
                  {group.group}
                </div>
                <ul className="space-y-1.5">
                  {group.items.map((perm) => {
                    const checked = permissions.includes(perm.slug);
                    return (
                      <li key={perm.slug}>
                        <label className="flex items-center gap-2 text-sm text-ink cursor-pointer hover:text-brand-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              togglePermission(perm.slug, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-line accent-brand-500"
                          />
                          <span>{perm.label}</span>
                          <span className="ml-auto text-[10px] font-mono text-ink-faint">
                            {perm.slug}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {err ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
