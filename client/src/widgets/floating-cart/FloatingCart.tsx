"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { formatSum } from "@/shared/lib/format";

/**
 * Wolt/Glovo-style floating cart pill. Surfaces the *existing* cart (count +
 * subtotal) in the thumb zone so checkout is one tap from anywhere. Purely a
 * presentation layer over the cart store — no new data.
 *
 * Hidden when the cart is empty, on the cart/checkout screens themselves, and
 * on desktop (where the header already carries the cart action).
 */
export function FloatingCart() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.cart?.itemCount ?? 0);
  const subtotal = useCartStore((s) => s.cart?.subtotal ?? 0);

  const hiddenRoute =
    pathname.startsWith("/cart") || pathname.startsWith("/checkout");
  if (itemCount === 0 || hiddenRoute) return null;

  return (
    <div
      className="lg:hidden pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 74px)" }}
    >
      <Link
        href="/cart"
        className="press animate-rise pointer-events-auto flex h-14 w-full max-w-md items-center gap-3 rounded-2xl bg-gradient-premium px-3 pr-4 text-white shadow-pop"
      >
        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <ShoppingCart className="h-5 w-5" strokeWidth={2} />
          <span className="absolute -top-1.5 -right-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-600 ring-2 ring-brand-500">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium text-white/85 leading-none">
            Savatni ko&apos;rish
          </span>
          <span className="mt-1 block text-base font-bold leading-none tabular-nums">
            {formatSum(subtotal)}
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0" strokeWidth={2.25} />
      </Link>
    </div>
  );
}
