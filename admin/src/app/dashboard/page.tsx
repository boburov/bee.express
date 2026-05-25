import {
  Bike,
  ShoppingBag,
  Store,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { StatCard } from "@/shared/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui/Card";

const stats: Array<{
  label: string;
  value: string;
  icon: React.ReactNode;
  delta?: { value: string; tone: "up" | "down" | "flat" };
}> = [
  { label: "Bugungi buyurtmalar", value: "—", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Bugungi tushum", value: "—", icon: <Wallet className="h-4 w-4" /> },
  { label: "Aktiv kuryerlar", value: "—", icon: <Bike className="h-4 w-4" /> },
  { label: "Aktiv sotuvchilar", value: "—", icon: <Store className="h-4 w-4" /> },
  { label: "Yangi ro'yxat", value: "—", icon: <UserPlus className="h-4 w-4" /> },
  { label: "Konversiya", value: "—", icon: <TrendingUp className="h-4 w-4" /> },
];

const nextSteps: string[] = [
  "Kategoriyalar daraxtini sozlash va dinamik atributlarni biriktirish.",
  "Birinchi adminlarni qo'shish (Rollar bo'limidan).",
  "Sotuvchi arizalarini moderatsiya qilish ro'yxatini yoqish.",
  "Yetkazib berish formulasini hudud bo'yicha kiritish.",
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Boshqaruv"
        description="Tizim umumiy ko'rsatkichlari. Real ma'lumotlar keyingi bosqichda ulanadi."
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
