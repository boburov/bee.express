"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Store,
  XCircle,
} from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Spinner } from "@/shared/ui/Spinner";
import { ordersApi } from "@/features/orders/api";
import { useOrder } from "@/features/orders/hooks";
import { ORDER_STATUS_META } from "@/features/orders/status";
import { formatDateTime, formatSum } from "@/shared/lib/format";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? null;
  const { data: order, loading, error, reload } = useOrder(orderId);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function onCancel() {
    if (!order) return;
    const reason = prompt("Bekor qilish sababi (ixtiyoriy):") ?? undefined;
    setCancelling(true);
    setCancelError(null);
    try {
      await ordersApi.cancel(order.id, reason || undefined);
      await reload();
    } catch (err) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e.response?.data?.message;
      setCancelError(Array.isArray(msg) ? msg[0] : msg || "Bekor qilinmadi");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }
  if (error || !order) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Buyurtmalar
        </Link>
        <p className="text-sm text-danger">{error ?? "Buyurtma topilmadi"}</p>
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const canCancel = order.status === "PENDING";
  const addr = order.addressSnapshot;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-ink truncate">{order.orderNumber}</h1>
          <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      {/* Store */}
      <Card>
        <div className="p-4 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 overflow-hidden">
            {order.store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.store.logoUrl} alt={order.store.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <Store className="h-5 w-5" strokeWidth={1.75} />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-ink truncate">{order.store.name}</h3>
            {order.store.address ? (
              <p className="text-xs text-ink-muted truncate">{order.store.address}</p>
            ) : null}
          </div>
          {order.store.phone ? (
            <a
              href={`tel:+998${String(order.store.phone).slice(-9)}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50"
              aria-label="Qo'ng'iroq"
            >
              <Phone className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </Card>

      {/* Items */}
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
                <p className="text-xs text-ink-muted">{it.qty}× {formatSum(it.price)}</p>
              </div>
              <p className="text-sm font-medium text-ink shrink-0">{formatSum(it.subtotal)}</p>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-line-soft text-sm flex flex-col gap-1.5">
          <div className="flex justify-between text-ink-muted"><span>Mahsulotlar</span><span>{formatSum(order.subtotal)}</span></div>
          <div className="flex justify-between text-ink-muted">
            <span>Yetkazib berish{order.distanceKm ? ` · ${order.distanceKm.toFixed(1)}km` : ""}</span>
            <span>{formatSum(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-ink font-semibold pt-2 border-t border-line-soft mt-1">
            <span>Jami</span><span>{formatSum(order.total)}</span>
          </div>
        </div>
      </Card>

      {/* Address snapshot */}
      {addr ? (
        <Card>
          <div className="p-4 flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <MapPin className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-ink">{addr.label}</h4>
              <p className="text-sm text-ink-soft">{addr.fullText}</p>
              {addr.notes ? <p className="text-xs text-ink-muted mt-1">Eslatma: {addr.notes}</p> : null}
            </div>
          </div>
        </Card>
      ) : null}

      {order.notes ? (
        <Card>
          <div className="p-4 text-sm">
            <h4 className="font-semibold text-ink mb-1">Sotuvchiga eslatma</h4>
            <p className="text-ink-soft">{order.notes}</p>
          </div>
        </Card>
      ) : null}

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
                  hMeta.tone === "danger" ? "bg-danger" : hMeta.tone === "success" ? "bg-success" : "bg-brand-500"
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

      {cancelError ? (
        <p className="text-sm text-danger">{cancelError}</p>
      ) : null}

      {canCancel ? (
        <Button
          variant="outline"
          leftIcon={<XCircle className="h-4 w-4" />}
          onClick={onCancel}
          loading={cancelling}
          block
        >
          Buyurtmani bekor qilish
        </Button>
      ) : null}
    </div>
  );
}
