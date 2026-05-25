"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { hasSellerRole, useAuthStore } from "@/lib/auth-store";

const nav = [
  { href: "/dashboard", label: "Boshqaruv" },
  { href: "/dashboard/products", label: "Mahsulotlar" },
  { href: "/dashboard/orders", label: "Buyurtmalar" },
  { href: "/dashboard/finance", label: "Moliya" },
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
          if (!hasSellerRole(r.data)) {
            clear();
            router.replace("/login");
            return;
          }
          setMe(r.data);
        })
        .catch(() => {
          clear();
          router.replace("/login");
        });
    } else if (!hasSellerRole(me)) {
      clear();
      router.replace("/login");
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

  if (!hydrated || !accessToken || !me || !hasSellerRole(me)) return null;

  const displayName = me.firstName || me.lastName
    ? [me.firstName, me.lastName].filter(Boolean).join(" ")
    : me.phone ?? "Sotuvchi";

  return (
    <div className="min-h-screen flex bg-surface-2">
      <aside className="w-64 shrink-0 border-r border-line bg-surface flex flex-col">
        <div className="px-6 py-5 border-b border-line">
          <Logo size={28} />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-bee-500 text-ink"
                    : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-line">
          <button
            onClick={onLogout}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink text-left"
          >
            Chiqish
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-line bg-surface flex items-center justify-between px-8">
          <div className="text-sm text-ink-muted">Sotuvchi paneli</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-muted">{displayName}</span>
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-ink text-bee-500 text-xs font-semibold">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
