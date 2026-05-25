"use client";

import { Package, ShoppingBag, Store, TrendingUp, Wallet } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui/Card";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Xush kelibsiz, ${name}`}
        description="Do'koningiz holatining qisqacha ko'rinishi. Real ma'lumotlar buyurtma va moliya modullari ulanganda paydo bo'ladi."
      />

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
