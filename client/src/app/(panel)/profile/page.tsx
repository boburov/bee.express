"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  Languages,
  MapPin,
  Shield,
} from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Card, CardBody } from "@/shared/ui/Card";
import { PageHeader } from "@/shared/ui/PageHeader";
import { LogoutButton } from "@/shared/auth/LogoutButton";
import { useAuthStore } from "@/shared/auth/store";

interface ProfileMenuItem {
  icon: typeof MapPin;
  label: string;
  hint: string | null;
  href?: string;
}

const sections: ProfileMenuItem[] = [
  { icon: MapPin, label: "Saqlangan manzillar", hint: null, href: "/addresses" },
  { icon: Bell, label: "Bildirishnomalar", hint: "Telegram orqali" },
  { icon: Languages, label: "Til", hint: "O'zbek" },
  { icon: Shield, label: "Maxfiylik", hint: null },
  { icon: HelpCircle, label: "Yordam va aloqa", hint: null },
];

function formatPhone(phone?: string | null): string {
  if (!phone || phone.length < 9) return phone ?? "";
  const last = phone.slice(-9);
  return `+998 ${last.slice(0, 2)} ${last.slice(2, 5)} ${last.slice(5, 7)} ${last.slice(7)}`;
}

export default function ProfilePage() {
  const me = useAuthStore((s) => s.me);

  const displayName = me?.firstName
    ? `${me.firstName}${me.lastName ? " " + me.lastName : ""}`
    : me?.phone
      ? formatPhone(me.phone)
      : "Foydalanuvchi";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Profil" description="Hisob ma'lumotlari va sozlamalar." />

      {/* Identity card */}
      <Card tone="warm">
        <CardBody className="flex items-center gap-4">
          <Avatar name={displayName} size={56} />
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold text-ink truncate">{displayName}</div>
            <div className="text-xs text-ink-muted mt-0.5 font-mono">
              {me?.phone ? formatPhone(me.phone) : "—"}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="brand" size="sm">
                {me?.role?.name ?? "Xaridor"}
              </Badge>
              {me?.telegramId ? (
                <Badge tone="info" size="sm">
                  Telegram
                </Badge>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats placeholder — wire to real data when orders/ratings ship */}
      <div className="grid grid-cols-3 gap-3">
        <StatCell label="Buyurtmalar" value="0" />
        <StatCell label="Faol" value="0" />
        <StatCell label="Reyting" value="—" />
      </div>

      {/* Settings list */}
      <Card>
        <ul className="divide-y divide-line-soft">
          {sections.map((item) => {
            const Icon = item.icon;
            const inner = (
              <>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-surface-3 text-ink-muted">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.hint ? (
                  <span className="text-xs text-ink-faint">{item.hint}</span>
                ) : null}
                <ChevronRight className="h-4 w-4 text-ink-faint" />
              </>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-ink-soft hover:bg-surface-3 transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-5 py-3 text-sm text-ink-soft hover:bg-surface-3 cursor-pointer transition-colors">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="px-1">
        <LogoutButton className="w-full justify-center h-11" />
      </div>

      <p className="text-center text-[10px] text-ink-faint mt-2">
        BeeExpress · MVP versiya
      </p>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-3 text-center shadow-card">
      <div className="text-lg font-semibold text-ink leading-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-muted mt-1">
        {label}
      </div>
    </div>
  );
}
