"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { useSellerOrders } from "@/features/orders/hooks";
import { ORDER_STATUS_LIST, ORDER_STATUS_META } from "@/features/orders/status";
import type { OrderStatus } from "@/features/orders/types";
import { formatDateTime, formatPhone, formatSum } from "@/shared/lib/format";

const PAGE_SIZE = 20;

export default function SellerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useSellerOrders({
    page,
    limit: PAGE_SIZE,
    status: statusFilter,
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Buyurtmalar"
        description="Do'koningizga kelgan buyurtmalar va ularning holatlari."
      />

      {/* Status filter chips */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto">
        <ul className="flex gap-2 w-max sm:w-auto sm:flex-wrap pb-1">
          <li>
            <button
              type="button"
              onClick={() => { setStatusFilter(undefined); setPage(1); }}
              className={`h-8 px-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === undefined
                  ? "bg-brand-500 text-white"
                  : "bg-surface-3 text-ink-soft hover:bg-line-soft"
              }`}
            >
              Barchasi
            </button>
          </li>
          {ORDER_STATUS_LIST.map((s) => {
            const active = statusFilter === s;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`h-8 px-3 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                    active ? "bg-brand-500 text-white" : "bg-surface-3 text-ink-soft hover:bg-line-soft"
                  }`}
                >
                  {ORDER_STATUS_META[s].label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" />}
          title={statusFilter ? "Bu holatda buyurtma yo'q" : "Hali buyurtma yo'q"}
          description={
            statusFilter
              ? "Filterni o'zgartirib ko'ring."
              : "Birinchi buyurtma kelganda shu yerda paydo bo'ladi."
          }
        />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-line-soft">
              {data.data.map((o) => {
                const meta = ORDER_STATUS_META[o.status];
                return (
                  <li key={o.id}>
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="flex items-center gap-3 p-4 hover:bg-surface-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-ink truncate font-mono">
                            {o.orderNumber}
                          </h3>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>
                        <p className="text-xs text-ink-muted">
                          {o.customerName ?? formatPhone(o.customerPhone)} ·{" "}
                          {formatDateTime(o.createdAt)}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {o.items.length} ta mahsulot ·{" "}
                          <span className="font-medium text-ink tabular-nums">
                            {formatSum(o.total)}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-faint shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>

          {data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Oldingi
              </Button>
              <span className="text-xs text-ink-muted">
                {page} / {data.meta.totalPages} · {data.meta.total} ta buyurtma
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
