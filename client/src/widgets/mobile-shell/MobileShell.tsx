"use client";

import { useEffect } from "react";
import { AuthBoundary } from "@/shared/auth/AuthBoundary";
import { RoleGuard } from "@/shared/auth/RoleGuard";
import { useAuthStore } from "@/shared/auth/store";
import { useCartStore } from "@/features/cart/store";
import { Topbar } from "@/widgets/topbar/Topbar";
import { BottomNav } from "@/widgets/bottom-nav/BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
}

/**
 * Customer panel chrome: AuthBoundary + RoleGuard + Topbar + BottomNav.
 *
 * Topbar shows a cart badge with the current `cart.itemCount` — populated
 * once after login so it survives navigation; individual pages reload on
 * their own as needed.
 */
export function MobileShell({ children }: MobileShellProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const cartCount = useCartStore((s) => s.cart?.itemCount ?? 0);
  const fetchCart = useCartStore((s) => s.fetch);

  useEffect(() => {
    if (accessToken) fetchCart();
  }, [accessToken, fetchCart]);

  return (
    <AuthBoundary>
      <RoleGuard allowed={[]}>
        <div className="min-h-screen flex flex-col bg-surface-2">
          <Topbar cartCount={cartCount} />
          <main className="flex-1 max-w-md w-full mx-auto px-4 py-4">{children}</main>
          <BottomNav />
        </div>
      </RoleGuard>
    </AuthBoundary>
  );
}
