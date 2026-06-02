"use client";

import Link from "next/link";
import { MapPin, ShoppingCart } from "lucide-react";
import { Logo } from "@/shared/ui/Logo";

interface TopbarProps {
  /** Cart item count — when present, renders a brand-dot badge on the cart icon. */
  cartCount?: number;
}

export function Topbar({ cartCount = 0 }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="relative max-w-md lg:max-w-none mx-auto h-14 lg:h-16 px-4 lg:px-8 flex items-center justify-between">
        {/* subtle warm gradient overlay — matches admin sidebar header */}
        <div
          className="absolute inset-0 bg-gradient-soft opacity-50 pointer-events-none"
          aria-hidden
        />

        <div className="relative flex items-center gap-2">
          {/* Logo on mobile only — the Sidebar owns it on desktop. */}
          <Logo size={28} className="lg:hidden" />
          {/* Address selector — surfaced on desktop where there's room on the left. */}
          <Link
            href="/profile"
            aria-label="Manzil"
            className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-ink-muted hover:bg-surface-3 hover:text-ink"
          >
            <MapPin className="h-4 w-4" />
            <span>Manzil yo&apos;q</span>
          </Link>
        </div>

        <div className="relative flex items-center gap-1">
          <Link
            href="/cart"
            aria-label={`Savat${cartCount ? ` (${cartCount})` : ""}`}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-3 hover:text-ink"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
            {cartCount > 0 ? (
              <span
                className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white"
                aria-hidden
              >
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
