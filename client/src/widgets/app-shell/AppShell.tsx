"use client";

import { useEffect } from "react";
import { AuthBoundary } from "@/shared/auth/AuthBoundary";
import { RoleGuard } from "@/shared/auth/RoleGuard";
import { useAuthStore } from "@/shared/auth/store";
import { useCartStore } from "@/features/cart/store";
import { useEnsureLocation } from "@/features/location/hooks";
import { NotificationsProvider } from "@/features/notifications/NotificationsProvider";
import { ToastStack } from "@/features/notifications/ToastStack";
import { Topbar } from "@/widgets/topbar/Topbar";
import { BottomNav } from "@/widgets/bottom-nav/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Customer panel chrome — Uzum Market-style marketplace layout:
 *
 *   • A full-width top header (logo · Katalog · search · account actions) on
 *     every viewport. No left rail — navigation lives in the header on desktop
 *     and in the BottomNav on mobile.
 *   • Content is centered inside a max-w-7xl canvas.
 *   • BottomNav shows below `lg` only.
 *
 * The cart badge is fed to the Topbar from `cart.itemCount`, populated once
 * after login so it survives navigation.
 */
export function AppShell({ children }: AppShellProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const cartCount = useCartStore((s) => s.cart?.itemCount ?? 0);
  const fetchCart = useCartStore((s) => s.fetch);

  useEffect(() => {
    if (accessToken) fetchCart();
  }, [accessToken, fetchCart]);

  // Seed the active "near me" location from the default address so FOOD
  // browsing and delivery-fee math work across every discovery page.
  useEnsureLocation();

  return (
    <AuthBoundary>
      <RoleGuard allowed={[]}>
        <NotificationsProvider>
          <div className="flex min-h-screen flex-col bg-surface-2">
            <Topbar cartCount={cartCount} />
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 lg:px-6 lg:py-6">
              {children}
            </main>
            <BottomNav />
          </div>
          <ToastStack />
        </NotificationsProvider>
      </RoleGuard>
    </AuthBoundary>
  );
}
