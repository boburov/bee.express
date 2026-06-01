"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, History as HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useMyOrders } from "@/features/deliveries/hooks";
import { formatDateTime, formatDistance, formatSum } from "@/lib/format";

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error } = useMyOrders({ scope: "history", page, limit: PAGE_SIZE });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader title="Tarix" description="Yakunlangan yetkazmalaringiz." />

      {loading && !data ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="h-6 w-6" />}
          title="Hali yetkazma yo'q"
          description="Birinchi buyurtmani yetkazganingizdan so'ng shu yerda ko'rinadi."
        />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-line-soft">
              {data.data.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/dashboard/deliveries/${o.id}`}
                    className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-semibold text-ink">
                        {o.orderNumber}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {o.pickup.storeName} · {formatDateTime(o.deliveredAt ?? o.createdAt)}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatDistance(o.distanceKm)} · jami{" "}
                        <span className="tabular-nums">{formatSum(o.total)}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-brand-700">
                        {formatSum(o.earning)}
                      </p>
                      <p className="text-[11px] text-ink-faint">daromad</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {data.meta.totalPages > 1 ? (
            <div className="mt-2 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Oldingi
              </Button>
              <span className="text-xs text-ink-muted">
                {page} / {data.meta.totalPages} · {data.meta.total} ta
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={page >= data.meta.totalPages}
              >
                Keyingi
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
