"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Megaphone, Search, Send, Users, X } from "lucide-react";
import { extractApiError } from "@/shared/auth/api";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";
import { useDebounce } from "@/shared/lib/useDebounce";
import { rolesApi } from "@/entities/role/api";
import type { Role } from "@/entities/role/types";
import { usersApi, userDisplayName } from "@/entities/user/api";
import type { AdminUser } from "@/entities/user/types";
import { notificationsApi, NOTIFICATION_TYPE_LABELS } from "@/entities/notification/api";
import type {
  NotificationTarget,
  NotificationType,
  SendNotificationResult,
} from "@/entities/notification/types";

interface SendFormProps {
  onSent: (result: SendNotificationResult) => void;
}

export function SendNotificationForm({ onSent }: SendFormProps) {
  const [target, setTarget] = useState<NotificationTarget>("BROADCAST");
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleSlug, setRoleSlug] = useState<string>("");
  const [pickedUsers, setPickedUsers] = useState<AdminUser[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("INFO");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    rolesApi.list().then((r) => {
      if (!cancelled) {
        setRoles(r);
        if (!roleSlug) setRoleSlug(r.find((x) => x.slug !== "admin")?.slug ?? r[0]?.slug ?? "");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false;
    if (target === "USER" && pickedUsers.length === 0) return false;
    if (target === "ROLE" && !roleSlug) return false;
    return true;
  }, [title, target, pickedUsers, roleSlug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await notificationsApi.send({
        target,
        title: title.trim(),
        body: body.trim() || undefined,
        type,
        userIds: target === "USER" ? pickedUsers.map((u) => u.id) : undefined,
        roleSlug: target === "ROLE" ? roleSlug : undefined,
      });
      setSuccess(`Yuborildi: ${res.recipients} ta foydalanuvchi`);
      setTitle("");
      setBody("");
      onSent(res);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yangi bildirishnoma</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Target tabs */}
          <TargetTabs value={target} onChange={setTarget} />

          {target === "USER" ? (
            <UserPicker picked={pickedUsers} onChange={setPickedUsers} />
          ) : null}

          {target === "ROLE" ? (
            <Select
              label="Rol"
              value={roleSlug}
              onChange={(e) => setRoleSlug(e.target.value)}
              hint="Tanlangan rolga ega barcha foydalanuvchilar (bloklanmaganlari) qabul qiladi."
            >
              {roles.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name} · {r.slug}
                </option>
              ))}
            </Select>
          ) : null}

          {target === "BROADCAST" ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <Megaphone className="h-4 w-4 mt-0.5" />
              <span>
                Hamma faol foydalanuvchilar bildirishnomani oladi. Ehtiyot bo&apos;ling — bu
                broadcast.
              </span>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
            <Input
              label="Sarlavha"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tizim haqida muhim e'lon"
              maxLength={140}
            />
            <Select
              label="Turi"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            >
              {Object.entries(NOTIFICATION_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-soft">Matn</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="To'liq matn..."
              className="rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200 resize-y"
            />
            <span className="text-xs text-ink-muted">
              {body.length} / 4000
            </span>
          </label>

          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="submit"
              loading={sending}
              disabled={!canSubmit}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Yuborish
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

// ─── Target tabs ───

interface TargetTabsProps {
  value: NotificationTarget;
  onChange: (v: NotificationTarget) => void;
}

function TargetTabs({ value, onChange }: TargetTabsProps) {
  const items: Array<{ value: NotificationTarget; label: string; icon: React.ReactNode }> = [
    { value: "BROADCAST", label: "Hammaga", icon: <Megaphone className="h-4 w-4" /> },
    { value: "ROLE", label: "Rol bo'yicha", icon: <Users className="h-4 w-4" /> },
    { value: "USER", label: "Aniq foydalanuvchilar", icon: <Search className="h-4 w-4" /> },
  ];
  return (
    <div className="inline-flex p-1 rounded-md bg-surface-3 border border-line gap-1 self-start">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium transition-colors ${
              active
                ? "bg-surface text-brand-700 shadow-card"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {it.icon}
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── User picker (search + chips) ───

interface UserPickerProps {
  picked: AdminUser[];
  onChange: (next: AdminUser[]) => void;
}

function UserPicker({ picked, onChange }: UserPickerProps) {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQ.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    usersApi
      .list({ q: debouncedQ.trim(), pageSize: 8 })
      .then((r) => setResults(r.items))
      .finally(() => setLoading(false));
  }, [debouncedQ]);

  function add(u: AdminUser) {
    if (picked.find((p) => p.id === u.id)) return;
    onChange([...picked, u]);
    setQ("");
    setResults([]);
  }

  function remove(id: string) {
    onChange(picked.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Input
        label="Foydalanuvchini qidirish"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Ism, familiya, telefon yoki @username"
        leftSlot={<Search className="h-4 w-4" />}
      />

      {results.length > 0 ? (
        <ul className="rounded-md border border-line bg-surface divide-y divide-line-soft max-h-56 overflow-y-auto">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => add(u)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-3"
              >
                <Avatar src={u.avatarUrl} name={userDisplayName(u)} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink truncate">
                    {userDisplayName(u)}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {u.phone ?? "—"} · {u.role?.name ?? "Rol yo'q"}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {loading ? <p className="text-xs text-ink-muted">Qidirilmoqda...</p> : null}

      {picked.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {picked.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 h-7 px-2 rounded-full bg-brand-50 border border-brand-100 text-xs text-brand-700"
            >
              {userDisplayName(u)}
              <button
                type="button"
                onClick={() => remove(u.id)}
                aria-label="O'chirish"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-brand-100"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <Badge tone="neutral">{picked.length} ta tanlandi</Badge>
        </div>
      ) : (
        <p className="text-xs text-ink-muted">
          Bo&apos;sh — qidirib, kerakli foydalanuvchilarni qo&apos;shing.
        </p>
      )}
    </div>
  );
}
