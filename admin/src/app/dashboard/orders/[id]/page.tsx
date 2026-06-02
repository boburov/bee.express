"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MapPin, Phone, Store } from "lucide-react";
import { extractApiError } from "@/shared/auth/api";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardBody } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { orderStatusLabel, orderStatusTone, ordersApi } from "@/entities/order/api";
import type { AdminOrder } from "@/entities/order/types";
import { formatDateTime, som } from "@/features/orders/orders-list/OrdersList";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? null;

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setOrder(await ordersApi.get(id));
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {order ? order.orderNumber : "Buyurtma"}
        </h1>
        {order ? (
          <Badge tone={orderStatusTone(order.status)}>{orderStatusLabel(order.status)}</Badge>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !order ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : order ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: items + totals */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card>
              <div className="p-4 border-b border-line flex items-center gap-2">
                <Store className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm font-semibold text-ink">{order.store?.name ?? "—"}</h2>
              </div>
              <ul className="divide-y divide-line-soft">
                {order.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <span className="text-ink-muted shrink-0 tabular-nums">{it.qty}×</span>
                    <span className="flex-1 min-w-0 truncate text-ink">{it.productTitle}</span>
                    <span className="text-ink shrink-0 tabular-nums">{som(it.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <CardBody className="border-t border-line space-y-1.5 text-sm">
                <Row label="Mahsulotlar" value={som(order.subtotal)} />
                <Row label="Yetkazib berish" value={som(order.deliveryFee)} />
                <div className="flex items-center justify-between pt-1.5 border-t border-line-soft">
                  <span className="font-semibold text-ink">Jami</span>
                  <span className="font-semibold text-ink tabular-nums">{som(order.total)}</span>
                </div>
              </CardBody>
            </Card>

            {/* Timeline */}
            <Card>
              <div className="p-4 border-b border-line">
                <h2 className="text-sm font-semibold text-ink">Holatlar tarixi</h2>
              </div>
              <ol className="p-4 space-y-3">
                {order.history.map((h) => (
                  <li key={h.id} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={orderStatusTone(h.status)} size="sm">
                          {orderStatusLabel(h.status)}
                        </Badge>
                        <span className="text-xs text-ink-muted">{formatDateTime(h.createdAt)}</span>
                      </div>
                      {h.note ? <p className="mt-0.5 text-xs text-ink-soft">{h.note}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Right: customer + meta */}
          <div className="flex flex-col gap-6">
            <Card>
              <div className="p-4 border-b border-line">
                <h2 className="text-sm font-semibold text-ink">Xaridor</h2>
              </div>
              <CardBody className="space-y-2 text-sm">
                <p className="text-ink">{order.customerName ?? "—"}</p>
                {order.customerPhone ? (
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="inline-flex items-center gap-1.5 text-brand-700 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" /> +{order.customerPhone}
                  </a>
                ) : null}
                {order.addressSnapshot?.fullText ? (
                  <p className="flex items-start gap-1.5 text-ink-muted">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{order.addressSnapshot.fullText}</span>
                  </p>
                ) : null}
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-1.5 text-sm">
                <Row label="To'lov" value={order.paymentMethod === "COD" ? "Naqd" : order.paymentMethod} />
                {order.distanceKm !== null ? (
                  <Row label="Masofa" value={`${order.distanceKm.toFixed(1)} km`} />
                ) : null}
                <Row label="Yaratilgan" value={formatDateTime(order.createdAt)} />
                {order.rejectionReason ? (
                  <div className="pt-1.5 border-t border-line-soft">
                    <p className="text-xs text-ink-muted">Bekor/rad sababi</p>
                    <p className="text-sm text-danger">{order.rejectionReason}</p>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink tabular-nums">{value}</span>
    </div>
  );
}
