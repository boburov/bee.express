"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Banknote,
  Check,
  MapPin,
  Navigation,
  Package,
  Phone,
  ShoppingBag,
  Store,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { courierApi } from "@/features/deliveries/api";
import { useCourierOrder } from "@/features/deliveries/hooks";
import { useGeolocation } from "@/lib/geolocation";
import {
  COURIER_ACTION,
  COURIER_STATUS_META,
  googleMapsDir,
  yandexPin,
} from "@/features/deliveries/status";
import { formatDateTime, formatDistance, formatPhoneNumber, formatSum } from "@/lib/format";

// Leaflet is browser-only — load the route map client-side.
const DeliveryMap = dynamic(
  () => import("@/features/deliveries/DeliveryMap").then((m) => m.DeliveryMap),
  {
    ssr: false,
    loading: () => <div className="h-60 w-full rounded-xl bg-surface-3 animate-pulse" />,
  },
);

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orderId = params?.id ?? null;
  const { data: order, loading, error, reload } = useCourierOrder(orderId);
  // Courier's live location → fed to Google Maps as `origin` so the route is
  // plotted automatically (not just a destination pin).
  const { coords: myCoords, error: geoError, request: requestGeo } = useGeolocation();

  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function advance() {
    if (!order) return;
    const action = COURIER_ACTION[order.status];
    if (!action) return;
    setPending(true);
    setActionError(null);
    try {
      await courierApi.updateStatus(order.id, { status: action.next as "ON_WAY" | "DELIVERED" });
      await reload();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      setActionError(Array.isArray(msg) ? msg[0] : msg || "Holat yangilanmadi");
    } finally {
      setPending(false);
    }
  }

  async function release() {
    if (!order) return;
    const reason = prompt("Buyurtmani qaytarish sababi (ixtiyoriy):");
    if (reason === null) return;
    setPending(true);
    setActionError(null);
    try {
      await courierApi.release(order.id, reason.trim() || undefined);
      router.push("/dashboard/deliveries");
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      setActionError(Array.isArray(msg) ? msg[0] : msg || "Qaytarib bo'lmadi");
      setPending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <BackLink />
        <p className="text-sm text-danger">{error ?? "Buyurtma topilmadi"}</p>
      </div>
    );
  }

  const meta = COURIER_STATUS_META[order.status];
  const action = COURIER_ACTION[order.status];
  const canRelease = order.status === "COURIER_ASSIGNED";
  const pickupNav = yandexPin(order.pickup.latitude, order.pickup.longitude);
  const dropoffNav = yandexPin(order.dropoff.latitude, order.dropoff.longitude);
  const dropoffGoogle = googleMapsDir(
    order.dropoff.latitude,
    order.dropoff.longitude,
    myCoords,
  );
  const isDelivered = order.status === "DELIVERED";
  const pickupPt =
    order.pickup.latitude != null && order.pickup.longitude != null
      ? { lat: order.pickup.latitude, lng: order.pickup.longitude, label: order.pickup.storeName }
      : null;
  const dropoffPt =
    order.dropoff.latitude != null && order.dropoff.longitude != null
      ? {
          lat: order.dropoff.latitude,
          lng: order.dropoff.longitude,
          label: order.dropoff.customerName ?? "Xaridor",
        }
      : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center gap-3">
        <BackLink iconOnly />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-mono text-lg font-semibold text-ink">{order.orderNumber}</h1>
          <p className="text-xs text-ink-muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      {/* Action bar */}
      {action || canRelease ? (
        <Card className="p-4">
          <div className="flex flex-col gap-2">
            {action ? (
              <Button loading={pending} disabled={pending} size="lg" onClick={advance}>
                <Check className="h-5 w-5" /> {action.label}
              </Button>
            ) : null}
            {canRelease ? (
              <Button
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={release}
                className="border-red-200 text-danger hover:bg-red-50"
              >
                <X className="h-4 w-4" /> Buyurtmani qaytarish
              </Button>
            ) : null}
          </div>
          {actionError ? <p className="mt-2 text-sm text-danger">{actionError}</p> : null}
        </Card>
      ) : null}

      {/* Route map — pickup → dropoff with external navigation */}
      {pickupPt && dropoffPt ? (
        <Card>
          <div className="flex items-center justify-between gap-2 border-b border-line-soft p-4">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
              <Navigation className="h-4 w-4 text-ink-muted" /> Yo&apos;nalish
            </h3>
            {dropoffNav ? (
              <a
                href={dropoffNav}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:underline"
              >
                <Navigation className="h-3.5 w-3.5" /> Yandex
              </a>
            ) : null}
          </div>
          <div className="p-3">
            <DeliveryMap pickup={pickupPt} dropoff={dropoffPt} />
            <div className="mt-2 flex items-center gap-4 text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Olish (sotuvchi)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Yetkazish (xaridor)
              </span>
            </div>
            {dropoffGoogle ? (
              <>
                <a
                  href={dropoffGoogle}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (!myCoords) requestGeo();
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
                >
                  <Navigation className="h-4 w-4" /> Google Maps orqali yo&apos;nalish
                </a>
                {!myCoords ? (
                  <button
                    type="button"
                    onClick={() => requestGeo()}
                    className="mt-1.5 w-full text-center text-[11px] text-ink-muted hover:text-ink"
                  >
                    {geoError
                      ? `${geoError} — aniq yo'nalish uchun joylashuvga ruxsat bering`
                      : "Aniq yo'nalish uchun joylashuvga ruxsat bering"}
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* Cash to collect (COD) */}
      {!isDelivered ? (
        <Card className="flex items-center gap-3 bg-brand-50 p-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15 text-brand-700">
            <Banknote className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs text-ink-muted">Xaridordan naqd olinadi</p>
            <p className="text-lg font-semibold tabular-nums text-ink">{formatSum(order.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-muted">Daromadingiz</p>
            <p className="font-semibold tabular-nums text-brand-700">{formatSum(order.earning)}</p>
          </div>
        </Card>
      ) : null}

      {/* Pickup — seller */}
      <Card>
        <div className="flex items-center gap-2 border-b border-line-soft p-4">
          <Store className="h-4 w-4 text-ink-muted" />
          <h3 className="text-sm font-semibold text-ink">Olish manzili (sotuvchi)</h3>
        </div>
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{order.pickup.storeName}</p>
            {order.pickup.address ? (
              <p className="text-sm text-ink-soft">{order.pickup.address}</p>
            ) : null}
            {order.pickupDistanceKm != null ? (
              <p className="mt-1 text-[11px] tabular-nums text-ink-faint">
                Sizdan {formatDistance(order.pickupDistanceKm)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {order.pickup.phone ? (
              <a
                href={`tel:+998${order.pickup.phone}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50"
                aria-label="Sotuvchiga qo'ng'iroq"
              >
                <Phone className="h-4 w-4" />
              </a>
            ) : null}
            {pickupNav ? (
              <a
                href={pickupNav}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
                aria-label="Xaritada ochish"
              >
                <Navigation className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Dropoff — customer */}
      <Card>
        <div className="flex items-center gap-2 border-b border-line-soft p-4">
          <User className="h-4 w-4 text-ink-muted" />
          <h3 className="text-sm font-semibold text-ink">Yetkazish manzili (xaridor)</h3>
        </div>
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              {order.dropoff.customerName ?? "Xaridor"}
            </p>
            {order.dropoff.label ? (
              <p className="text-xs text-ink-muted">{order.dropoff.label}</p>
            ) : null}
            {order.dropoff.fullText ? (
              <p className="text-sm text-ink-soft">{order.dropoff.fullText}</p>
            ) : null}
            {order.dropoff.notes ? (
              <p className="mt-1 text-xs text-ink-muted">Eslatma: {order.dropoff.notes}</p>
            ) : null}
            {order.distanceKm != null ? (
              <p className="mt-1 text-[11px] tabular-nums text-ink-faint">
                Sotuvchidan {formatDistance(order.distanceKm)}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {order.dropoff.customerPhone ? (
              <a
                href={`tel:+998${String(order.dropoff.customerPhone).slice(-9)}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-700 hover:bg-brand-50"
                aria-label="Xaridorga qo'ng'iroq"
              >
                <Phone className="h-4 w-4" />
              </a>
            ) : null}
            {dropoffNav ? (
              <a
                href={dropoffNav}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
                aria-label="Xaritada ochish"
              >
                <Navigation className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </Card>

      {/* Items */}
      {order.items && order.items.length > 0 ? (
        <Card>
          <div className="flex items-center gap-2 border-b border-line-soft p-4">
            <Package className="h-4 w-4 text-ink-muted" />
            <h3 className="text-sm font-semibold text-ink">Tarkib</h3>
          </div>
          <ul className="divide-y divide-line-soft">
            {order.items.map((it) => (
              <li key={it.id} className="flex gap-3 p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-line-soft bg-surface-3">
                  {it.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imageUrl} alt={it.productTitle} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-faint">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-ink">{it.productTitle}</p>
                  <p className="text-xs tabular-nums text-ink-muted">
                    {it.qty}× {formatSum(it.price)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums text-ink">
                  {formatSum(it.subtotal)}
                </p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-1.5 border-t border-line-soft p-4 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>Mahsulotlar</span>
              <span className="tabular-nums">{formatSum(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-ink-muted">
              <span>Yetkazib berish</span>
              <span className="tabular-nums">{formatSum(order.deliveryFee)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-line-soft pt-2 font-semibold text-ink">
              <span>Jami (naqd)</span>
              <span className="tabular-nums">{formatSum(order.total)}</span>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Timeline */}
      {order.history && order.history.length > 0 ? (
        <Card>
          <div className="border-b border-line-soft p-4">
            <h3 className="text-sm font-semibold text-ink">Holat tarixi</h3>
          </div>
          <ol className="flex flex-col gap-3 p-4">
            {order.history.map((h) => {
              const hMeta = COURIER_STATUS_META[h.status];
              return (
                <li key={h.id} className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      hMeta.tone === "danger"
                        ? "bg-danger"
                        : hMeta.tone === "success"
                          ? "bg-success"
                          : "bg-brand-500"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{hMeta.label}</p>
                    <p className="text-xs text-ink-muted">{formatDateTime(h.createdAt)}</p>
                    {h.note ? <p className="mt-1 text-xs text-ink-soft">{h.note}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      ) : null}
    </div>
  );
}

function BackLink({ iconOnly }: { iconOnly?: boolean }) {
  return (
    <Link
      href="/dashboard/deliveries"
      className={
        iconOnly
          ? "inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
          : "inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      }
      aria-label="Orqaga"
    >
      <ArrowLeft className="h-4 w-4" />
      {iconOnly ? null : "Yetkazmalar"}
    </Link>
  );
}
