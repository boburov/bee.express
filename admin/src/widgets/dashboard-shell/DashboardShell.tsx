"use client";

import { AuthBoundary } from "@/shared/auth/AuthBoundary";
import { RoleGuard } from "@/shared/auth/RoleGuard";
import { RealtimeProvider } from "@/shared/realtime/RealtimeProvider";
import { Sidebar } from "@/widgets/sidebar/Sidebar";
import { Topbar } from "@/widgets/topbar/Topbar";
import { RealtimeToasts } from "@/widgets/realtime-toasts/RealtimeToasts";

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Outer chrome for every admin page. Order:
 *   AuthBoundary    → wait for hydration, redirect if no token
 *   RoleGuard       → super_admin only (UX); server enforces too
 *   RealtimeProvider → Socket.IO connection for live notifications
 *   Sidebar + Topbar + main content area
 *   RealtimeToasts  → live notification toasts (bottom-right)
 */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <AuthBoundary>
      <RoleGuard allowed={["super_admin"]} redirectTo="/login">
        <RealtimeProvider>
          <div className="min-h-screen flex bg-surface-2">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Topbar />
              <main className="flex-1 px-6 lg:px-8 py-6 lg:py-8">{children}</main>
            </div>
          </div>
          <RealtimeToasts />
        </RealtimeProvider>
      </RoleGuard>
    </AuthBoundary>
  );
}
