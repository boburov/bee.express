"use client";

import { AuthBoundary } from "@/shared/auth/AuthBoundary";
import { RoleGuard } from "@/shared/auth/RoleGuard";
import { Topbar } from "@/widgets/topbar/Topbar";
import { BottomNav } from "@/widgets/bottom-nav/BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
}

/**
 * Customer panel chrome: AuthBoundary + RoleGuard + Topbar + BottomNav.
 * RoleGuard allows any authenticated user (empty allowed list); server still
 * enforces per-endpoint roles.
 */
export function MobileShell({ children }: MobileShellProps) {
  return (
    <AuthBoundary>
      <RoleGuard allowed={[]}>
        <div className="min-h-screen flex flex-col bg-surface-2">
          <Topbar />
          <main className="flex-1 max-w-md w-full mx-auto px-4 py-4">{children}</main>
          <BottomNav />
        </div>
      </RoleGuard>
    </AuthBoundary>
  );
}
