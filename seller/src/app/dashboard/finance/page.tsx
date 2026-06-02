"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  ClipboardList,
  PackageCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { Card, CardBody } from "@/shared/ui/Card";
import { Skeleton } from "@/shared/ui/Skeleton";
import { extractApiError } from "@/shared/auth/api";
import { formatSum } from "@/shared/lib/format";
import { financeApi, type SellerFinanceSummary } from "@/features/finance/api";

export default function SellerFinancePage() {
  const [data, setData] = useState<SellerFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    financeApi
      .summary()
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
        description="Yetkazilgan buyurtmalar bo'yicha savdo hisoboti. Mahsulot savdosi — sizning daromadingiz; yetkazib berish to'lovi kuryerga o'tadi."
      />

      {error ? (
        <Card>
          <CardBody className="text-sm text-danger">{error}</CardBody>
        </Card>
      ) : loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Bugungi buyurtmalar" value={String(data.todayOrders)} icon={<ShoppingBag className="h-4 w-4" />} />
          <StatCard label="Bugungi savdo" value={formatSum(data.todayProductSales)} icon={<Wallet className="h-4 w-4" />} />
          <StatCard label="Faol buyurtmalar" value={String(data.activeOrders)} icon={<ClipboardList className="h-4 w-4" />} />
          <StatCard label="Jami yetkazilgan" value={String(data.deliveredOrders)} icon={<PackageCheck className="h-4 w-4" />} />
          <StatCard label="Mahsulot savdosi" value={formatSum(data.productSales)} icon={<Banknote className="h-4 w-4" />} />
          <StatCard label="Yetkazib berish (kuryerga)" value={formatSum(data.deliveryFees)} icon={<Truck className="h-4 w-4" />} />
        </div>
      ) : null}
    </div>
  );
}
