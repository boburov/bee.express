"use client";

import { MapPin, Bell, HelpCircle } from "lucide-react";
import { Card, CardBody } from "@/shared/ui/Card";
import { LogoutButton } from "@/shared/auth/LogoutButton";
import { PageHeader } from "@/shared/ui/PageHeader";
import { useAuthStore } from "@/shared/auth/store";

const items = [
  { icon: MapPin, label: "Saqlangan manzillar" },
  { icon: Bell, label: "Bildirishnomalar" },
  { icon: HelpCircle, label: "Yordam" },
];

export default function ProfilePage() {
  const me = useAuthStore((s) => s.me);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Profil" />

      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-premium text-white text-base font-semibold">
              {(me?.firstName ?? me?.phone ?? "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-ink truncate">
                {me?.firstName
                  ? `${me.firstName}${me.lastName ? " " + me.lastName : ""}`
                  : (me?.phone ?? "Foydalanuvchi")}
              </div>
              <div className="text-xs text-ink-muted">
                {me?.phone ? `+${me.phone}` : me?.telegramId ?? ""}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <ul className="divide-y divide-line-soft">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="flex items-center gap-3 px-5 py-3 text-sm text-ink-soft hover:bg-surface-3 cursor-pointer"
              >
                <Icon className="h-4 w-4 text-ink-muted" strokeWidth={1.75} />
                <span className="flex-1">{item.label}</span>
                <span className="text-xs text-ink-faint">tez orada</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="px-1">
        <LogoutButton />
      </div>
    </div>
  );
}
