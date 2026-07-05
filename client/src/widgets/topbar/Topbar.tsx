"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  MapPin,
  Search,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { Logo } from "@/shared/ui/Logo";
import { useActiveLocation } from "@/features/location/hooks";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { cn } from "@/shared/lib/cn";

interface TopbarProps {
  /** Cart item count — renders a badge on the cart action. */
  cartCount?: number;
}

/**
 * Uzum-style marketplace header. One component, fully responsive:
 *
 *   • Desktop (lg+) — single row: logo · "Katalog" button · big search bar ·
 *     right-hand action column (Manzil / Buyurtmalar / Profil / Savat).
 *   • Mobile (< lg) — two rows: logo + bell/cart, then a full-width search bar.
 *
 * Primary navigation on mobile lives in the BottomNav; here the search and cart
 * are surfaced. Brand orange is the only accent — the rest mirrors Uzum Market.
 */
export function Topbar({ cartCount = 0 }: TopbarProps) {
  const location = useActiveLocation();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      {/* ── Desktop row ─────────────────────────────────────────── */}
      <div className="hidden lg:flex mx-auto max-w-7xl h-16 items-center gap-5 px-6">
        <Link href="/home" className="shrink-0" aria-label="Bosh sahifa">
          <Logo size={34} />
        </Link>

        <Link
          href="/catalog"
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
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
        <div className="flex items-center justify-between">
          <Link href="/home" aria-label="Bosh sahifa">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link
              href="/cart"
              aria-label={`Savat${cartCount ? ` (${cartCount})` : ""}`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-surface-3"
            >
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              {cartCount > 0 ? <Badge count={cartCount} /> : null}
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
        "group flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface-3 pl-3.5 pr-1.5 text-sm text-ink-muted transition-colors hover:border-brand-300 hover:bg-surface",
        className,
      )}
    >
      <Search className="h-4.5 w-4.5 shrink-0 text-ink-muted" strokeWidth={2} />
      <span className="flex-1 truncate text-left">
        Mahsulot yoki sotuvchini qidiring
      </span>
      <span className="hidden lg:inline-flex h-8 items-center rounded-lg bg-brand-500 px-3.5 text-xs font-semibold text-white group-hover:bg-brand-600">
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
        "relative flex w-16 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-brand-700" : "text-ink-muted hover:text-ink",
      )}
    >
      <span className="relative">
        <Icon className="h-6 w-6" strokeWidth={1.75} />
        {badge > 0 ? <Badge count={badge} /> : null}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span
      className="absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface"
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
