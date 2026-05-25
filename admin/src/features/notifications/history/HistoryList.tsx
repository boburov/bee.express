"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Megaphone, Send } from "lucide-react";
import { extractApiError } from "@/shared/auth/api";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { notificationsApi, NOTIFICATION_TYPE_LABELS } from "@/entities/notification/api";
import type { NotificationGroup } from "@/entities/notification/types";

interface HistoryListProps {
  /** Bumped after each successful send so the list refetches. */
  refreshKey: number;
}

const PAGE_SIZE = 10;

const typeTone: Record<string, "brand" | "success" | "warning" | "danger" | "neutral"> = {
  INFO: "brand",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  ANNOUNCE: "neutral",
};

export function HistoryList({ refreshKey }: HistoryListProps) {
  const [data, setData] = useState<{ items: NotificationGroup[]; page: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationsApi.history(page, PAGE_SIZE);
      setData(res);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone className="h-6 w-6" />}
        title="Hozircha bildirishnoma yuborilmagan"
        description="Birinchi xabaringizni yuborganingizdan keyin yuborilgan barcha xabarlar tarixi shu yerda turadi."
      />
    );
  }

  // Treat total as unknown — server doesn't return it for groupBy queries.
  // Use a generous total to keep pagination working; rely on empty page to stop.
  const fakeTotal = data.items.length < PAGE_SIZE
    ? (page - 1) * PAGE_SIZE + data.items.length
    : page * PAGE_SIZE + 1;

  return (
    <div className="flex flex-col gap-3">
      <ul className="space-y-3">
        {data.items.map((g) => (
          <li key={g.groupId}>
            <Card>
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Send className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{g.title}</h3>
                      <Badge tone={typeTone[g.type] ?? "neutral"} size="sm">
                        {NOTIFICATION_TYPE_LABELS[g.type] ?? g.type}
                      </Badge>
                    </div>
                    {g.body ? (
                      <p className="text-sm text-ink-muted mt-1 line-clamp-3">{g.body}</p>
                    ) : null}
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      <span>
                        {new Date(g.createdAt).toLocaleString("uz-UZ", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Send className="h-3 w-3" /> {g.recipients} ta
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {g.deliveredCount} yetkazildi
                      </span>
                      <span>
                        {g.readCount} o&apos;qildi
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </li>
        ))}
      </ul>

      <div className="pt-1">
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={fakeTotal}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
