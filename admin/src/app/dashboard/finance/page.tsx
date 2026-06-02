"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Bike,
  PackageCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { Card, CardBody } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { extractApiError } from "@/shared/auth/api";
import { som, statsApi, type FinanceSummary } from "@/entities/stats/api";

export default function FinancePage() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    statsApi
      .finance()
      .then((s) => {
        if (!cancelled) setData(s);
      })
      .catch((e) => {
        if (!cancelled) setError(extractApiError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Moliya"
        description="Yetkazilgan buyurtmalar bo'yicha umumiy hisobot. Platforma daromadi — yetkazib berish marjasidan (yetkazish to'lovi − kuryer ulushi)."
      />

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Yetkazilgan buyurtmalar" value={String(data.deliveredOrders)} icon={<PackageCheck className="h-4 w-4" />} />
          <StatCard label="Umumiy savdo" value={som(data.grossSales)} icon={<ShoppingBag className="h-4 w-4" />} />
          <StatCard label="Mahsulot savdosi" value={som(data.productSales)} icon={<Banknote className="h-4 w-4" />} />
          <StatCard label="Yetkazib berish to'lovlari" value={som(data.deliveryFees)} icon={<Truck className="h-4 w-4" />} />
          <StatCard label="Kuryerlarga to'lov" value={som(data.courierPayouts)} icon={<Bike className="h-4 w-4" />} />
          <StatCard label="Platforma daromadi" value={som(data.platformCommission)} icon={<TrendingUp className="h-4 w-4" />} />
        </div>
      ) : null}

      <Card>
        <CardBody className="text-sm text-ink-muted">
          {"Sotuvchilar/kuryerlar bo'yicha batafsil to'lov hisoboti, davr bo'yicha filtr va Excel eksport keyingi bosqichda qo'shiladi. Hozir komissiya stavkasi tizim konstantasi (kuryer ulushi 80%); sozlanuvchi qilish — Sozlamalar bo'limi bilan birga keladi."}
        </CardBody>
      </Card>
    </div>
  );
}
