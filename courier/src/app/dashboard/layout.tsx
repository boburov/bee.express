"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { hasCourierRole, useAuthStore } from "@/lib/auth-store";
import { NotificationsProvider } from "@/features/notifications/NotificationsProvider";
import { ToastStack } from "@/features/notifications/ToastStack";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { formatPhoneNumber } from "@/lib/format";

const nav = [
  { href: "/dashboard", label: "Boshqaruv" },
  { href: "/dashboard/deliveries", label: "Yetkazmalar" },
  { href: "/dashboard/stores", label: "Do'konlar" },
  { href: "/dashboard/history", label: "Tarix" },
  { href: "/dashboard/earnings", label: "Daromad" },
  { href: "/dashboard/profile", label: "Profil" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const me = useAuthStore((s) => s.me);
  const setMe = useAuthStore((s) => s.setMe);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (!me) {
      api
        .get("/auth/me")
        .then((r) => {
          setMe(r.data);
          // Authenticated but not yet a courier → onboarding, not logout.
          if (!hasCourierRole(r.data)) router.replace("/apply");
        })
        .catch(() => {
          clear();
          router.replace("/login");
        });
    } else if (!hasCourierRole(me)) {
      router.replace("/apply");
    }
  }, [hydrated, accessToken, me, setMe, clear, router]);

  async function onLogout() {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } finally {
      clear();
      router.replace("/login");
    }
  }

  if (!hydrated || !accessToken || !me || !hasCourierRole(me)) return null;

  const displayName = me.firstName || me.lastName
    ? [me.firstName, me.lastName].filter(Boolean).join(" ")
    : me.phone ? formatPhoneNumber(me.phone) : "Kuryer";

  return (
    <NotificationsProvider>
    <div className="min-h-screen flex flex-col bg-surface-2">
      <header className="h-16 border-b border-line bg-surface flex items-center justify-between px-4 sm:px-6">
        <Logo size={28} />
        <div className="flex items-center gap-3 text-sm">
          <NotificationBell />
          <span className="text-ink-muted hidden sm:inline">{displayName}</span>
          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <button
            onClick={onLogout}
            className="text-sm font-medium text-ink-muted hover:text-ink"
          >
            Chiqish
          </button>
        </div>
      </header>

      <nav className="border-b border-line bg-surface overflow-x-auto">
        <ul className="flex gap-1 px-4 sm:px-6 py-2 min-w-max">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-500 text-white"
                      : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
      <ToastStack />
    </NotificationsProvider>
  );
}
