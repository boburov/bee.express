"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { hasSellerRole, useAuthStore } from "@/shared/auth/store";

interface RoleGuardProps {
  children: React.ReactNode;
  /** Where to send users without the seller role. Defaults to inline 403. */
  redirectTo?: string;
}

/**
 * Seller-only role guard. The seller panel exposes exactly one role, so this
 * guard is intentionally less generic than admin's: it short-circuits to
 * `hasSellerRole(me)` instead of accepting an allow-list.
 *
 * Authentication itself is handled by `AuthBoundary`; this component runs
 * AFTER `me` is set.
 */
export function RoleGuard({ children, redirectTo }: RoleGuardProps) {
  const router = useRouter();
  const me = useAuthStore((s) => s.me);
  const clear = useAuthStore((s) => s.clear);
  const ok = hasSellerRole(me);

  useEffect(() => {
    if (me && !ok && redirectTo) {
      clear();
      router.replace(redirectTo);
    }
  }, [me, ok, redirectTo, router, clear]);

  if (!me) return null; // AuthBoundary handles this
  if (!ok) {
    if (redirectTo) return null;
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <EmptyState
          icon={<ShieldAlert className="h-7 w-7" />}
          title="Ruxsat yo'q"
          description="Bu hisob sotuvchi roliga ega emas. Administrator bilan bog'laning."
        />
      </div>
    );
  }
  return <>{children}</>;
}
