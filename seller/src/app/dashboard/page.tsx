"use client";

import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, Store, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui/Card";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { StatCard } from "@/shared/ui/StatCard";
import { StatusBanner } from "@/features/store/StatusBanner";
import { useMyStore } from "@/features/store/hooks";
import { useAuthStore } from "@/shared/auth/store";

const stats: Array<{
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: { value: string; tone: "up" | "down" | "flat" };
}> = [
  { label: "Bugungi buyurtmalar", value: "—", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Bugungi tushum", value: "—", icon: <Wallet className="h-4 w-4" /> },
  { label: "Aktiv mahsulotlar", value: "—", icon: <Package className="h-4 w-4" /> },
  { label: "Do'kon reytingi", value: "—", icon: <Store className="h-4 w-4" /> },
  { label: "Konversiya", value: "—", icon: <TrendingUp className="h-4 w-4" /> },
];

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

  return (
    <div className="flex flex-col gap-8">
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
              <h3 className="text-base font-semibold text-ink">Avval do'kon yarating</h3>
              <p className="text-sm text-ink-muted mt-1">
                Buyurtma qabul qila boshlash uchun do'kon ma'lumotlarini to'ldiring va admin tasdig'ini kuting.
              </p>
            </div>
            <Link href="/dashboard/store">
              <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                Do'kon yaratish
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <StatusBanner store={store} onUpdated={setData} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={s.icon}
            delta={s.delta}
          />
        ))}
      </div>

      {!store || store.status !== "ACTIVE" ? (
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
      ) : (
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Statistika tez orada"
          description="Bugungi buyurtmalar, tushum va konversiya hisoblanadi."
        />
      )}
    </div>
  );
}
