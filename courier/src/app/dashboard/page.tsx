"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  MapPin,
  Navigation,
  Package,
  Power,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";
import { courierApi } from "@/features/deliveries/api";
import { useCourierProfile, useCourierStats } from "@/features/deliveries/hooks";
import { COURIER_STATUS_META } from "@/features/deliveries/status";
import { formatDistance, formatSum } from "@/lib/format";
import { useAuthStore } from "@/lib/auth-store";

export default function DashboardPage() {
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName ?? me?.phone ?? "kuryer";

  const { data: stats, loading: statsLoading, reload: reloadStats } = useCourierStats();
  const { data: profile, reload: reloadProfile } = useCourierProfile();
  const [toggling, setToggling] = useState(false);

  const online = profile?.isOnline ?? false;
  const activeOrder = stats?.activeOrders[0] ?? null;

  async function toggleOnline() {
    setToggling(true);
    try {
      await courierApi.updateProfile({ isOnline: !online });
      await reloadProfile();
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Greeting + online toggle */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-warm px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-ink-muted">Xush kelibsiz,</p>
              <h1 className="truncate text-xl font-semibold text-ink">{name}</h1>
            </div>
            <button
              type="button"
              onClick={toggleOnline}
              disabled={toggling}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
                online
                  ? "bg-success/10 text-success ring-1 ring-success/30"
                  : "bg-surface-3 text-ink-muted ring-1 ring-line"
              }`}
            >
              <Power className="h-4 w-4" strokeWidth={2} />
              {online ? "Aktiv" : "Noaktiv"}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {online
              ? "Siz aktivsiz — yangi buyurtmalar ko'rinadi."
              : "Aktiv tugmasini bosib ish kunini boshlang."}
          </p>
        </div>
      </Card>

      {/* Today stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Bugungi daromad"
          value={statsLoading ? "…" : formatSum(stats?.today.earning ?? 0)}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Bugungi yetkazmalar"
          value={statsLoading ? "…" : (stats?.today.deliveries ?? 0)}
          icon={<Package className="h-4 w-4" />}
        />
      </div>

      {/* Current / active order */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Joriy buyurtma</CardTitle>
          {stats && stats.activeOrders.length > 1 ? (
            <Badge tone="brand">+{stats.activeOrders.length - 1} ta yana</Badge>
          ) : null}
        </CardHeader>
        <CardBody>
          {statsLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : activeOrder ? (
            <Link
              href={`/dashboard/deliveries/${activeOrder.id}`}
              className="block rounded-xl border border-line p-4 transition-colors hover:bg-surface-2"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-ink">
                  {activeOrder.orderNumber}
                </span>
                <Badge tone={COURIER_STATUS_META[activeOrder.status].tone}>
                  {COURIER_STATUS_META[activeOrder.status].label}
                </Badge>
              </div>
              <p className="flex items-center gap-1.5 text-sm text-ink-soft">
                <MapPin className="h-4 w-4 shrink-0 text-ink-muted" />
                {activeOrder.pickup.storeName}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-ink-muted">
                  {activeOrder.itemsCount} ta mahsulot · {formatDistance(activeOrder.distanceKm)}
                </span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  {formatSum(activeOrder.earning)}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ) : (
            <EmptyState
              icon={<Navigation className="h-6 w-6" />}
              title="Faol buyurtma yo'q"
              description="Yangi buyurtmalarni qabul qilish uchun yetkazmalar bo'limiga o'ting."
              action={
                <Link
                  href="/dashboard/deliveries"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-bee-500 px-4 text-sm font-medium text-ink hover:bg-bee-600"
                >
                  Buyurtmalarni ko'rish
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
          )}
        </CardBody>
      </Card>

      <button
        type="button"
        onClick={() => reloadStats()}
        className="self-center text-xs text-ink-muted hover:text-ink"
      >
        Yangilash
      </button>
    </div>
  );
}
