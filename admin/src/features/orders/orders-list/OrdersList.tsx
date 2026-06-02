"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { extractApiError } from "@/shared/auth/api";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardBody } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Input } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Select } from "@/shared/ui/Select";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useDebounce } from "@/shared/lib/useDebounce";
import {
  ORDER_STATUSES,
  orderStatusLabel,
  orderStatusTone,
  ordersApi,
} from "@/entities/order/api";
import type { AdminOrder, OrderStatus, PaginatedOrders } from "@/entities/order/types";

const PAGE_SIZE = 20;

export function OrdersList() {
  const [data, setData] = useState<PaginatedOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [page, setPage] = useState(1);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ordersApi.list({
        q: debouncedQ.trim() || undefined,
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setData(res);
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, status, page]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, status]);

  return (
    <Card>
      <div className="p-4 flex flex-wrap items-end gap-3 border-b border-line">
        <div className="flex-1 min-w-[240px]">
          <Input
            placeholder="Buyurtma raqami bo'yicha qidiring (BEE-...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftSlot={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-52">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | OrderStatus)}
          >
            <option value="">Barcha holatlar</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
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
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data && data.data.length === 0 ? (
          <EmptyState
            className="m-6"
            icon={<ShoppingBag className="h-6 w-6" />}
            title="Buyurtma topilmadi"
            description="Hali buyurtma yo'q yoki filterga mos kelmadi."
          />
        ) : (
          <ul className="divide-y divide-line-soft">
            {data?.data.map((order) => <OrderRow key={order.id} order={order} />)}
          </ul>
        )}
      </CardBody>

      {data && data.meta.total > 0 ? (
        <div className="p-3 border-t border-line">
          <Pagination
            page={data.meta.page}
            pageSize={data.meta.limit}
            total={data.meta.total}
            onPageChange={setPage}
          />
        </div>
      ) : null}
    </Card>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  return (
    <li>
      <Link
        href={`/dashboard/orders/${order.id}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-muted">
          <ShoppingBag className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-medium text-ink">{order.orderNumber}</span>
            <Badge tone={orderStatusTone(order.status)} size="sm">
              {orderStatusLabel(order.status)}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
            <span className="truncate">{order.store?.name ?? "—"}</span>
            {order.customerName ? <span>· {order.customerName}</span> : null}
            <span>· {formatDateTime(order.createdAt)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold text-ink tabular-nums">{som(order.total)}</p>
          <p className="text-[11px] text-ink-faint">{order.items.length} ta mahsulot</p>
        </div>
      </Link>
    </li>
  );
}

export function som(n: number): string {
  return `${n.toLocaleString("ru-RU")} so'm`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("uz-UZ")} · ${d.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
