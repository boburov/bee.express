"use client";

import { useEffect, useState } from "react";
import {
  Bike,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { TrendChart } from "@/shared/ui/TrendChart";
import { extractApiError } from "@/shared/auth/api";
import {
  som,
  statsApi,
  type DailyPoint,
  type DashboardSummary,
} from "@/entities/stats/api";

const nextSteps: string[] = [
  "Kategoriyalar daraxtini sozlash va dinamik atributlarni biriktirish.",
  "Birinchi adminlarni qo'shish (Rollar bo'limidan).",
  "Sotuvchi arizalarini moderatsiya qilish ro'yxatini yoqish.",
  "Yetkazib berish formulasini hudud bo'yicha kiritish.",
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<DailyPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    statsApi
      .dashboard()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch((e) => {
        if (!cancelled) setError(extractApiError(e));
      });
    statsApi
      .timeseries(14)
      .then((t) => {
        if (!cancelled) setTrend(t);
      })
      .catch(() => {
        /* chart is supplementary — keep the page usable if it fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    { label: "Bugungi buyurtmalar", value: summary ? String(summary.ordersToday) : "—", icon: <ShoppingBag className="h-4 w-4" /> },
    { label: "Bugungi tushum", value: summary ? som(summary.revenueToday) : "—", icon: <Wallet className="h-4 w-4" /> },
    { label: "Bu oydagi sotuvlar", value: summary ? som(summary.productSalesMonth) : "—", icon: <Package className="h-4 w-4" /> },
    { label: "Ishdagi kuryerlar", value: summary ? String(summary.workingCouriers) : "—", icon: <Bike className="h-4 w-4" /> },
    { label: "Aktiv sotuvchilar", value: summary ? String(summary.activeStores) : "—", icon: <Store className="h-4 w-4" /> },
    { label: "Yangi ro'yxat", value: summary ? String(summary.newSignupsToday) : "—", icon: <UserPlus className="h-4 w-4" /> },
    { label: "Konversiya", value: summary ? `${summary.conversionPct}%` : "—", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Boshqaruv"
        description="Tizim umumiy ko'rsatkichlari — bugungi buyurtma va tushum, aktiv ishtirokchilar."
      />

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Daromad va buyurtmalar — so'nggi 14 kun</CardTitle>
          <div className="flex items-center gap-4 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-brand-500" />
              Daromad
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded-full bg-ink-soft" />
              Buyurtmalar
            </span>
          </div>
        </CardHeader>
        <CardBody>
          {trend ? (
            <TrendChart data={trend} />
          ) : (
            <Skeleton className="h-[240px] w-full" rounded="lg" />
          )}
        </CardBody>
      </Card>

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
    </div>
  );
}
