"use client";

import { useState } from "react";
import { AuthBoundary } from "@/shared/auth/AuthBoundary";
import { RoleGuard } from "@/shared/auth/RoleGuard";
import { Sidebar } from "@/widgets/sidebar/Sidebar";
import { Topbar } from "@/widgets/topbar/Topbar";

interface DashboardShellProps {
  children: React.ReactNode;
}

/**
 * Outer chrome for every seller dashboard page. Order:
 *   AuthBoundary  → wait for hydration, redirect if no token
 *   RoleGuard     → seller-only (server still enforces via @Roles("seller"))
 *   Sidebar + Topbar + main content area
 */
export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <AuthBoundary>
      <RoleGuard redirectTo="/login">
        <div className="min-h-screen flex bg-surface-2">
          <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
            <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</main>
          </div>
        </div>
      </RoleGuard>
    </AuthBoundary>
  );
}
