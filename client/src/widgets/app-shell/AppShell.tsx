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
import { Sidebar } from "@/widgets/sidebar/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Customer panel chrome. Responsive across one breakpoint (`lg`):
 *
 *   • Mobile (< lg) — Telegram Mini App layout: Topbar + centered max-w-md
 *     content + BottomNav. Unchanged from the original mobile-only shell.
 *   • Desktop (lg+) — dashboard layout: fixed left Sidebar + wider content
 *     canvas. BottomNav hides; the Topbar drops its logo (the Sidebar owns it).
 *
 * The cart badge is fed to both Topbar and Sidebar from `cart.itemCount`,
 * populated once after login so it survives navigation.
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
          <div className="min-h-screen bg-surface-2 lg:flex">
            <Sidebar cartCount={cartCount} />
            <div className="flex flex-col min-h-screen flex-1 min-w-0">
              <Topbar cartCount={cartCount} />
              <main className="flex-1 w-full mx-auto max-w-md lg:max-w-5xl px-4 py-4 lg:px-8 lg:py-8">
                {children}
              </main>
              <BottomNav />
            </div>
          </div>
          <ToastStack />
        </NotificationsProvider>
      </RoleGuard>
    </AuthBoundary>
  );
}
