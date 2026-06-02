"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { Logo } from "@/shared/ui/Logo";
import { LogoutButton } from "@/shared/auth/LogoutButton";
import { customerNav } from "@/shared/config/nav";
import { useAuthStore } from "@/shared/auth/store";
import { cn } from "@/shared/lib/cn";
import { formatPhone } from "@/shared/lib/format";

interface SidebarProps {
  /** Cart item count — drives the brand-dot badge on the "Savat" link. */
  cartCount?: number;
}

/**
 * Desktop-only left rail for the customer panel. Hidden below `lg`, where the
 * mobile chrome (Topbar + BottomNav) takes over instead. Mirrors the admin
 * sidebar styling so both panels share one visual identity (DESIGN_SYSTEM §7.1):
 * Logo header → nav → user card + logout.
 */
export function Sidebar({ cartCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const me = useAuthStore((s) => s.me);

  const displayName = me?.firstName
    ? `${me.firstName}${me.lastName ? " " + me.lastName : ""}`
    : me?.phone
      ? formatPhone(me.phone)
      : "Mehmon";

  return (
    <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen w-64 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-4 border-b border-line bg-gradient-soft">
        <Logo size={32} />
      </div>

      <nav aria-label="Asosiy navigatsiya" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {customerNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-surface-3 hover:text-ink",
              )}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", active ? "text-brand-500" : "text-ink-muted")}
                strokeWidth={1.75}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* Cart — lives in the Topbar on mobile, so it's surfaced here for desktop. */}
        <Link
          href="/cart"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/cart")
              ? "bg-brand-50 text-brand-700"
              : "text-ink-soft hover:bg-surface-3 hover:text-ink",
          )}
        >
          <ShoppingCart
            className={cn("h-4 w-4 shrink-0", pathname.startsWith("/cart") ? "text-brand-500" : "text-ink-muted")}
            strokeWidth={1.75}
          />
          <span className="flex-1 truncate">Savat</span>
          {cartCount > 0 ? (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </Link>
      </nav>

      <div className="border-t border-line p-3 space-y-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={displayName} size={36} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-ink truncate">{displayName}</div>
            <div className="text-[11px] uppercase tracking-wider text-ink-muted">
              {me?.role?.name ?? "Xaridor"}
            </div>
          </div>
        </div>
        <LogoutButton className="w-full justify-start" />
      </div>
    </aside>
  );
}
