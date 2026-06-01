"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Inbox, MapPinOff, PackageCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { courierApi } from "@/features/deliveries/api";
import { DeliveryCard } from "@/features/deliveries/DeliveryCard";
import { extractMsg, useAvailableOrders, useMyOrders } from "@/features/deliveries/hooks";
import { formatDistance } from "@/lib/format";
import { useGeolocation } from "@/lib/geolocation";

export default function DeliveriesPage() {
  const router = useRouter();
  const { coords, error: geoError, loading: geoLoading, request } = useGeolocation(true);

  const {
    data: active,
    loading: activeLoading,
    reload: reloadActive,
  } = useMyOrders({ scope: "active", limit: 50 });
  const {
    data: pool,
    loading: poolLoading,
    error: poolError,
    reload: reloadPool,
  } = useAvailableOrders(coords);

  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  async function onAccept(id: string) {
    setAcceptingId(id);
    setAcceptError(null);
    try {
      await courierApi.accept(id);
      router.push(`/dashboard/deliveries/${id}`);
    } catch (e) {
      setAcceptError(extractMsg(e));
      // The order was likely claimed by someone else — refresh the pool.
      reloadPool();
      reloadActive();
    } finally {
      setAcceptingId(null);
    }
  }

  function refreshAll() {
    request();
    reloadPool();
    reloadActive();
  }

  const activeOrders = active?.data ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        title="Yetkazmalar"
        description="Atrofingizdagi yangi buyurtmalarni qabul qiling."
        action={
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" /> Yangilash
          </Button>
        }
      />

      {/* In-progress orders */}
      {activeOrders.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-ink">Faol buyurtmalarim</h2>
          {activeOrders.map((o) => (
            <DeliveryCard key={o.id} order={o} href={`/dashboard/deliveries/${o.id}`} />
          ))}
        </section>
      ) : activeLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : null}

      {/* Available pool */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Mavjud buyurtmalar</h2>
          {pool ? (
            <span className="text-xs text-ink-muted">
              {coords ? `${formatDistance(pool.radiusKm)} radius` : "Butun hudud"}
            </span>
          ) : null}
        </div>

        {geoError ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="flex items-center gap-1.5 font-medium">
              <MapPinOff className="h-4 w-4" /> {geoError}
            </p>
            <p className="mt-1 text-xs">
              Joylashuvsiz barcha buyurtmalar ko&apos;rsatiladi. Masofa hisoblanmaydi.
            </p>
            <button
              onClick={request}
              className="mt-2 text-xs font-semibold text-amber-900 underline"
            >
              Joylashuvga ruxsat berish
            </button>
          </div>
        ) : null}

        {acceptError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {acceptError}
          </div>
        ) : null}

        {(poolLoading || geoLoading) && !pool ? (
          <div className="flex justify-center py-10">
            <Spinner label="Buyurtmalar yuklanmoqda" />
          </div>
        ) : poolError ? (
          <p className="text-sm text-danger">{poolError}</p>
        ) : !pool || pool.orders.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="Hozircha bo'sh buyurtma yo'q"
            description="Yangi buyurtma chiqishi bilan shu yerda paydo bo'ladi. Birozdan so'ng yangilang."
          />
        ) : (
          pool.orders.map((o) => (
            <DeliveryCard
              key={o.id}
              order={o}
              footer={
                <Button
                  size="sm"
                  className="w-full"
                  loading={acceptingId === o.id}
                  disabled={acceptingId !== null}
                  onClick={() => onAccept(o.id)}
                >
                  <PackageCheck className="h-4 w-4" /> Qabul qilaman
                </Button>
              }
            />
          ))
        )}
      </section>
    </div>
  );
}
