"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, LogIn, Search, ShieldCheck, User as UserIcon } from "lucide-react";
import { extractApiError } from "@/shared/auth/api";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Select } from "@/shared/ui/Select";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useDebounce } from "@/shared/lib/useDebounce";
import { actionLabel, auditApi } from "@/entities/audit/api";
import type { AuditEntry, AuditListResponse } from "@/entities/audit/types";

const PAGE_SIZE = 30;

export function AuditList() {
  const [data, setData] = useState<AuditListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState("");
  const debouncedAction = useDebounce(action, 300);
  const [actorType, setActorType] = useState<"" | "USER" | "SUPER_ADMIN" | "SYSTEM">("");
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.list({
        action: debouncedAction.trim() || undefined,
        actorType: actorType || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, [debouncedAction, actorType, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [debouncedAction, actorType]);

  return (
    <Card>
      <div className="p-4 flex flex-wrap items-end gap-3 border-b border-line">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Amal nomi bo'yicha qidiring (auth.login, user.block, ...)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            leftSlot={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-44">
          <Select
            value={actorType}
            onChange={(e) =>
              setActorType(
                e.target.value as "" | "USER" | "SUPER_ADMIN" | "SYSTEM",
              )
            }
          >
            <option value="">Barcha aktorlar</option>
            <option value="SUPER_ADMIN">Super admin</option>
            <option value="USER">Foydalanuvchi</option>
            <option value="SYSTEM">Tizim</option>
          </Select>
        </div>
      </div>

      <CardBody className="px-0 pb-0">
        {error ? (
          <div className="m-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.items.length === 0 ? (
          <EmptyState
            className="m-6"
            icon={<Activity className="h-6 w-6" />}
            title="Audit yozuvlari topilmadi"
            description="Tizimda hech qanday harakat hali qayd etilmagan yoki filterga mos kelmadi."
          />
        ) : (
          <ul className="divide-y divide-line-soft">
            {data?.items.map((entry) => <AuditRow key={entry.id} entry={entry} />)}
          </ul>
        )}
      </CardBody>

      {data && data.total > 0 ? (
        <div className="p-3 border-t border-line">
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </Card>
  );
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const Icon = iconFor(entry.action);
  return (
    <li className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${actionTone(
          entry.action,
        )}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{actionLabel(entry.action)}</span>
          <Badge tone={actorTone(entry.actorType)} size="sm">
            {actorTypeLabel(entry.actorType)}
          </Badge>
          {entry.resource ? (
            <span className="text-xs text-ink-muted">→ {entry.resource}</span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
          {entry.actor ? <span>{entry.actor.label}</span> : null}
          {entry.ip ? <span className="font-mono">{entry.ip}</span> : null}
          <span>{formatDateTime(entry.createdAt)}</span>
          {entry.resourceId ? (
            <span className="font-mono text-ink-faint truncate">#{entry.resourceId}</span>
          ) : null}
        </div>
        {entry.metadata && Object.keys(entry.metadata as object).length > 0 ? (
          <pre className="mt-2 max-w-full overflow-x-auto rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-[11px] text-ink-soft">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        ) : null}
      </div>
    </li>
  );
}

function iconFor(action: string) {
  if (action.startsWith("auth.login")) return LogIn;
  if (action.startsWith("user.")) return UserIcon;
  if (action.startsWith("role.")) return ShieldCheck;
  return Activity;
}

function actionTone(action: string): string {
  if (action.startsWith("auth.login")) return "bg-sky-50 text-sky-700";
  if (action === "user.block") return "bg-red-50 text-red-700";
  if (action === "user.unblock") return "bg-green-50 text-green-700";
  if (action.startsWith("role.")) return "bg-brand-50 text-brand-700";
  return "bg-surface-3 text-ink-muted";
}

function actorTypeLabel(t: AuditEntry["actorType"]): string {
  switch (t) {
    case "SUPER_ADMIN":
      return "Super admin";
    case "USER":
      return "Foydalanuvchi";
    default:
      return "Tizim";
  }
}

function actorTone(t: AuditEntry["actorType"]) {
  switch (t) {
    case "SUPER_ADMIN":
      return "brand" as const;
    case "USER":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("uz-UZ")} · ${d.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

