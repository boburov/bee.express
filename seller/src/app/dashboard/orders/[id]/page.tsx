"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Spinner } from "@/shared/ui/Spinner";
import { sellerOrdersApi } from "@/features/orders/api";
import { useSellerOrder } from "@/features/orders/hooks";
import { ORDER_STATUS_META, SELLER_TRANSITIONS } from "@/features/orders/status";
import type { OrderStatus } from "@/features/orders/types";
import { formatDateTime, formatPhone, formatSum } from "@/shared/lib/format";

/**
 * Per-status forward action labels. The button color is derived from the
 * target status' tone — "REJECTED" lands as danger, everything else as
 * brand. CANCELLED is also danger since it's seller-initiated cancel.
 */
const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  ACCEPTED:  "Qabul qilish",
  REJECTED:  "Rad etish",
  PREPARING: "Tayyorlashni boshlash",
  READY:     "Tayyor",
  ON_WAY:    "Kuryerga berildi",
  DELIVERED: "Yetkazildi",
  CANCELLED: "Bekor qilish",
};

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? null;
  const { data: order, loading, error, reload } = useSellerOrder(orderId);
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function onTransition(target: OrderStatus) {
    if (!order) return;

    // REJECTED / CANCELLED need a reason — prompt the seller for one.
    let note: string | undefined;
    if (target === "REJECTED" || target === "CANCELLED") {
      const reason = prompt(
        target === "REJECTED"
          ? "Rad etish sababi (xaridorga ko'rinadi):"
          : "Bekor qilish sababi (xaridorga ko'rinadi):",
      );
      if (reason === null) return; // dismissed
      note = reason.trim() || undefined;
    }

    setPending(target);
    setActionError(null);
    try {
      await sellerOrdersApi.updateStatus(order.id, { status: target, note });
      await reload();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setActionError(Array.isArray(msg) ? msg[0] : msg || "Holat yangilanmadi");
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }
  if (error || !order) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Buyurtmalar
        </Link>
        <p className="text-sm text-danger">{error ?? "Buyurtma topilmadi"}</p>
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const nextStatuses = SELLER_TRANSITIONS[order.status];
  const addr = order.addressSnapshot;

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink font-mono truncate">
            {order.orderNumber}
          </h1>
          <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      {/* Action buttons — only when transitions exist */}
      {nextStatuses.length > 0 ? (
        <Card>
          <div className="p-4 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-muted mr-2">
              Harakat:
            </span>
            {nextStatuses.map((next) => {
              const isDanger = next === "REJECTED" || next === "CANCELLED";
              const isLoading = pending === next;
              return (
                <Button
                  key={next}
                  size="sm"
                  variant={isDanger ? "outline" : "primary"}
                  loading={isLoading}
                  disabled={pending !== null}
                  leftIcon={isDanger ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  onClick={() => onTransition(next)}
                  className={isDanger ? "text-danger border-red-200 hover:bg-red-50" : undefined}
                >
                  {ACTION_LABEL[next] ?? next}
                </Button>
              );
            })}
          </div>
          {actionError ? (
            <div className="px-4 pb-4 flex items-start gap-2 text-sm text-danger">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{actionError}</span>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ─── Customer + address ──────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <Card>
            <div className="p-4 border-b border-line-soft">
              <h3 className="text-sm font-semibold text-ink">Xaridor</h3>
            </div>
            <div className="p-4 flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <User className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">
                  {order.customerName ?? "Anonim"}
                </p>
                <p className="text-xs text-ink-muted font-mono mt-0.5">
                  {formatPhone(order.customerPhone)}
                </p>
              </div>
              {order.customerPhone ? (
                <a
                  href={`tel:+${order.customerPhone}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50"
                  aria-label="Qo'ng'iroq"
                >
                  <Phone className="h-4 w-4" />
                </a>
              ) : null}
            </div>
          </Card>

          {addr ? (
            <Card>
              <div className="p-4 border-b border-line-soft">
                <h3 className="text-sm font-semibold text-ink">Yetkazib berish manzili</h3>
              </div>
              <div className="p-4 flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <MapPin className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{addr.label}</p>
                  <p className="text-sm text-ink-soft">{addr.fullText}</p>
                  {addr.notes ? (
                    <p className="text-xs text-ink-muted mt-1">Eslatma: {addr.notes}</p>
                  ) : null}
                  {order.distanceKm !== null ? (
                    <p className="text-[11px] text-ink-faint mt-1 tabular-nums">
                      Masofa: {order.distanceKm.toFixed(1)} km
                    </p>
                  ) : null}
                </div>
                <a
                  href={`https://yandex.uz/maps/?ll=${addr.longitude},${addr.latitude}&z=17&pt=${addr.longitude},${addr.latitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-brand-700 hover:underline shrink-0"
                >
                  Xaritada
                </a>
              </div>
            </Card>
          ) : null}

          {order.notes ? (
            <Card>
              <div className="p-4">
                <h4 className="text-sm font-semibold text-ink mb-1">Xaridor eslatmasi</h4>
                <p className="text-sm text-ink-soft">{order.notes}</p>
              </div>
            </Card>
          ) : null}
        </div>

        {/* ─── Items + totals ──────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <Card>
            <div className="p-4 border-b border-line-soft">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Package className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                Tarkib
              </h3>
            </div>
            <ul className="divide-y divide-line-soft">
              {order.items.map((it) => (
                <li key={it.id} className="p-3 flex gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-md bg-surface-3 border border-line-soft overflow-hidden">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt={it.productTitle} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-ink-faint">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink line-clamp-2">{it.productTitle}</p>
                    <p className="text-xs text-ink-muted tabular-nums">
                      {it.qty}× {formatSum(it.price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-ink shrink-0 tabular-nums">
                    {formatSum(it.subtotal)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="p-4 border-t border-line-soft text-sm flex flex-col gap-1.5">
              <div className="flex justify-between text-ink-muted">
                <span>Mahsulotlar</span>
                <span className="tabular-nums">{formatSum(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Yetkazib berish</span>
                <span className="tabular-nums">{formatSum(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-ink font-semibold pt-2 border-t border-line-soft mt-1">
                <span>Jami</span>
                <span className="tabular-nums">{formatSum(order.total)}</span>
              </div>
              <p className="text-[11px] text-ink-faint mt-1">
                To'lov: {order.paymentMethod === "COD" ? "Naqd (yetkazib berishda)" : order.paymentMethod}
              </p>
            </div>
          </Card>

          {/* Status timeline */}
          <Card>
            <div className="p-4 border-b border-line-soft">
              <h3 className="text-sm font-semibold text-ink">Holat tarixi</h3>
            </div>
            <ol className="p-4 flex flex-col gap-3">
              {order.history.map((h) => {
                const hMeta = ORDER_STATUS_META[h.status];
                return (
                  <li key={h.id} className="flex gap-3 items-start">
                    <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${
                      hMeta.tone === "danger" ? "bg-danger"
                        : hMeta.tone === "success" ? "bg-success"
                        : "bg-brand-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{hMeta.label}</p>
                      <p className="text-xs text-ink-muted">{formatDateTime(h.createdAt)}</p>
                      {h.note ? <p className="text-xs text-ink-soft mt-1">{h.note}</p> : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          {order.rejectionReason ? (
            <Card>
              <div className="p-4 flex items-start gap-3 text-sm text-danger">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{order.rejectionReason}</span>
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
