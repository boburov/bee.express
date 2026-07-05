"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  ShoppingBag,
  ShoppingCart,
  User,
  type LucideIcon,
} from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { cn } from "@/shared/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** When true, renders the live cart count as a badge. */
  cart?: boolean;
}

/**
 * Uzum-style mobile tab bar: Asosiy · Katalog · Savat · Buyurtmalar · Profil.
 * The cart tab carries a live item-count badge. Hidden on `lg+`, where the
 * header owns navigation.
 */
const items: NavItem[] = [
  { href: "/home", label: "Asosiy", icon: Home },
  { href: "/catalog", label: "Katalog", icon: LayoutGrid },
  { href: "/cart", label: "Savat", icon: ShoppingCart, cart: true },
  { href: "/orders", label: "Buyurtmalar", icon: ShoppingBag },
  { href: "/profile", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.cart?.itemCount ?? 0);

  return (
    <nav
      aria-label="Asosiy navigatsiya"
      className="lg:hidden sticky bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const badge = item.cart ? cartCount : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-brand-600" : "text-ink-muted hover:text-ink",
                )}
              >
                <span className="relative">
                  <Icon
                    className="h-6 w-6"
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  {badge > 0 ? (
                    <span
                      className="absolute -top-1.5 -right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-surface"
                      aria-hidden
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
