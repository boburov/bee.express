"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { useOrders } from "@/features/orders/hooks";
import { ORDER_STATUS_LIST, ORDER_STATUS_META } from "@/features/orders/status";
import type { OrderStatus } from "@/features/orders/types";
import { formatDateTime, formatSum } from "@/shared/lib/format";

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, loading, error } = useOrders({ page, limit: PAGE_SIZE, status: statusFilter });

  return (
    <div className="flex flex-col gap-5 w-full lg:max-w-3xl lg:mx-auto">
      <PageHeader
        title="Buyurtmalarim"
        description="Buyurtma holatlari va tarix."
      />

      {/* Status chips — horizontal scroll on mobile for the long list */}
      <div className="-mx-4 px-4 overflow-x-auto">
        <ul className="flex gap-2 w-max pb-1">
          <li>
            <button
              type="button"
              onClick={() => { setStatusFilter(undefined); setPage(1); }}
              className={`press h-8 px-3.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === undefined
                  ? "bg-gradient-premium text-white shadow-cta"
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
                  className={`press h-8 px-3.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                    active ? "bg-gradient-premium text-white shadow-cta" : "bg-surface-3 text-ink-soft hover:bg-line-soft"
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
          title={statusFilter ? "Bu holatda buyurtma yo'q" : "Hali buyurtma bermagansiz"}
          description={statusFilter ? "Filterni o'zgartirib ko'ring yoki katalogni oching." : "Birinchi buyurtmangizni katalogdan tanlang."}
          action={!statusFilter ? <Link href="/catalog"><Button>Katalogni ochish</Button></Link> : undefined}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {data.data.map((o) => {
              const meta = ORDER_STATUS_META[o.status];
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="press block rounded-2xl bg-surface shadow-card hover:shadow-hover"
                  >
                    <div className="p-4 flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                        <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-bold text-ink truncate">{o.store.name}</h3>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </div>
                        <p className="text-xs text-ink-muted">
                          {o.orderNumber} · {formatDateTime(o.createdAt)}
                        </p>
                        <p className="text-xs font-medium text-ink-soft mt-1 tabular-nums">
                          {o.items.length} ta mahsulot · {formatSum(o.total)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-ink-faint shrink-0" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

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
                {page} / {data.meta.totalPages}
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
