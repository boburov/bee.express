"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Package, ShoppingBag, Store, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui/Card";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { StatCard } from "@/shared/ui/StatCard";
import { StatusBanner } from "@/features/store/StatusBanner";
import { useMyStore } from "@/features/store/hooks";
import { useAuthStore } from "@/shared/auth/store";
import { extractApiError } from "@/shared/auth/api";
import { formatSum } from "@/shared/lib/format";
import { statsApi, type SellerDashboardSummary } from "@/entities/stats/api";

const nextSteps: string[] = [
  "Do'kon ma'lumotlarini to'ldiring (KYC, manzil, ish vaqti).",
  "Birinchi mahsulotlaringizni qo'shing va moderatsiyaga yuboring.",
  "Yetkazib berish radiusini va kuryerlar bilan ishlash sxemasini sozlang.",
  "Bank rekvizitlarini kiriting — to'lov qabul qilish uchun.",
];

export default function DashboardPage() {
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName ?? (me?.phone ? `+${me.phone}` : "sotuvchi");
  const { data: store, loading, hasLoaded, setData } = useMyStore();

  const isActive = store?.status === "ACTIVE";
  const [summary, setSummary] = useState<SellerDashboardSummary | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let cancelled = false;
    statsApi
      .dashboard()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((e) => {
        if (!cancelled) setStatsError(extractApiError(e));
      });
    return () => {
      cancelled = true;
    };
  }, [isActive]);

  const cards: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    { label: "Bugungi buyurtmalar", value: summary ? String(summary.ordersToday) : "—", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "Bugungi tushum", value: summary ? formatSum(summary.revenueToday) : "—", icon: <Wallet className="h-4 w-4" /> },
    { label: "Aktiv mahsulotlar", value: summary ? String(summary.activeProducts) : "—", icon: <Package className="h-4 w-4" /> },
    { label: "Do'kon reytingi", value: summary && summary.storeRating > 0 ? summary.storeRating.toFixed(1) : "—", icon: <Store className="h-4 w-4" /> },
    { label: "Konversiya", value: summary ? `${summary.conversionPct}%` : "—", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Xush kelibsiz, ${name}`}
        description="Do'koningiz holati va boshqaruv markazi."
      />

      {/* Store status / create CTA — first thing the seller sees */}
      {loading && !hasLoaded ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : !store ? (
        <Card>
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Store className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-ink">Avval do&apos;kon yarating</h3>
              <p className="text-sm text-ink-muted mt-1">
                Buyurtma qabul qila boshlash uchun do&apos;kon ma&apos;lumotlarini to&apos;ldiring va admin tasdig&apos;ini kuting.
              </p>
            </div>
            <Link href="/dashboard/store">
              <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                Do&apos;kon yaratish
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <StatusBanner store={store} onUpdated={setData} />
      )}

      {isActive ? (
        <>
          {statsError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-danger">
              {statsError}
            </div>
          ) : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((s) => (
              <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Keyingi qadamlar</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2.5">
              {nextSteps.map((t) => (
                <li key={t} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                  />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
