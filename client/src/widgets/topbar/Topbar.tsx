"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  LayoutGrid,
  MapPin,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { Logo } from "@/shared/ui/Logo";
import { Avatar } from "@/shared/ui/Avatar";
import { useActiveLocation } from "@/features/location/hooks";
import { useAuthStore } from "@/shared/auth/store";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { formatPhone } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";

interface TopbarProps {
  /** Cart item count — renders a badge on the cart action (desktop). */
  cartCount?: number;
}

/**
 * Food-delivery header. One component, fully responsive:
 *
 *   • Mobile (< lg) — address-first: a tappable delivery-address chip on the
 *     left, bell + profile on the right, then a big search bar. Cart lives in
 *     the BottomNav + the floating cart pill, so it isn't duplicated here.
 *   • Desktop (lg+) — logo · Katalog · search · action column.
 *
 * Warm red-orange is the only accent; everything else stays calm and white.
 */
export function Topbar({ cartCount = 0 }: TopbarProps) {
  const location = useActiveLocation();
  const me = useAuthStore((s) => s.me);
  const name = me?.firstName || (me?.phone ? formatPhone(me.phone) : "Mehmon");

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* ── Desktop row ─────────────────────────────────────────── */}
      <div className="hidden lg:flex mx-auto max-w-7xl h-16 items-center gap-5 px-6">
        <Link href="/home" className="shrink-0" aria-label="Bosh sahifa">
          <Logo size={34} />
        </Link>

        <Link
          href="/catalog"
          className="press inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-gradient-premium px-4 text-sm font-semibold text-white shadow-cta"
        >
          <LayoutGrid className="h-5 w-5" strokeWidth={2} />
          Katalog
        </Link>

        <SearchBar className="flex-1" />

        <nav className="flex shrink-0 items-center gap-1">
          <ActionItem
            href="/addresses"
            icon={MapPin}
            label={truncate(location?.label ?? "Manzil", 12)}
          />
          <ActionItem href="/orders" icon={ShoppingBag} label="Buyurtmalar" />
          <ActionItem href="/profile" icon={User} label="Profil" />
          <ActionItem
            href="/cart"
            icon={ShoppingCart}
            label="Savat"
            badge={cartCount}
          />
          <span className="ml-1">
            <NotificationBell />
          </span>
        </nav>
      </div>

      {/* ── Mobile rows ─────────────────────────────────────────── */}
      <div className="lg:hidden px-4 pt-2.5 pb-2.5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/addresses"
            className="press group flex min-w-0 flex-1 items-center gap-2 text-left"
            aria-label="Yetkazib berish manzilini o'zgartirish"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <MapPin className="h-4.5 w-4.5" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-medium text-ink-muted leading-none">
                Yetkazib berish manzili
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-ink">
                <span className="max-w-40 truncate">
                  {location?.label ?? "Manzil tanlang"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-muted" strokeWidth={2.25} />
              </span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell />
            <Link
              href="/profile"
              aria-label="Profil"
              className="press inline-flex items-center justify-center rounded-full"
            >
              <Avatar name={name} size={36} className="ring-2 ring-brand-100" />
            </Link>
          </div>
        </div>
        <div className="mt-2.5">
          <SearchBar />
        </div>
      </div>
    </header>
  );
}

function SearchBar({ className }: { className?: string }) {
  return (
    <Link
      href="/catalog"
      className={cn(
        "press group flex h-12 items-center gap-2.5 rounded-2xl border border-line bg-surface-3 pl-4 pr-1.5 text-sm text-ink-muted transition-colors hover:border-brand-300 hover:bg-surface",
        className,
      )}
    >
      <Search className="h-5 w-5 shrink-0 text-brand-500" strokeWidth={2} />
      <span className="flex-1 truncate text-left">
        Taom yoki do&apos;kon qidiring
      </span>
      <span className="hidden lg:inline-flex h-9 items-center rounded-xl bg-gradient-premium px-4 text-xs font-semibold text-white">
        Qidirish
      </span>
    </Link>
  );
}

function ActionItem({
  href,
  icon: Icon,
  label,
  badge = 0,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={cn(
        "relative flex w-16 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-brand-600" : "text-ink-muted hover:text-ink",
      )}
    >
      <span className="relative">
        <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
        {badge > 0 ? <Badge count={badge} /> : null}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span
      className="absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-hot-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface"
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
