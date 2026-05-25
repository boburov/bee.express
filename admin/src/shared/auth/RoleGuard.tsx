"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore, type Me } from "@/shared/auth/store";
import { EmptyState } from "@/shared/ui/EmptyState";
import { ShieldAlert } from "lucide-react";

/**
 * Slugs that frontend RoleGuard understands. `super_admin` matches `me.type`,
 * the rest are `me.role.slug` (see /docs/auth-and-rbac.md).
 */
export type AllowedRole = "super_admin" | "admin" | "seller" | "courier" | "customer";

interface RoleGuardProps {
  children: React.ReactNode;
  allowed: AllowedRole[];
  /** Where to redirect unauthorized visitors. If omitted, an inline 403 renders. */
  redirectTo?: string;
}

export function matchRole(me: Me | null, allowed: AllowedRole[]): boolean {
  if (!me) return false;
  if (me.type === "super_admin") {
    // super_admin always satisfies its own slug, otherwise needs explicit allow
    return allowed.includes("super_admin");
  }
  const slug = me.role?.slug as AllowedRole | undefined;
  return !!slug && allowed.includes(slug);
}

export function RoleGuard({ children, allowed, redirectTo }: RoleGuardProps) {
  const router = useRouter();
  const me = useAuthStore((s) => s.me);
  const allowedSerialized = allowed.join(",");
  const ok = matchRole(me, allowed);

  useEffect(() => {
    if (me && !ok && redirectTo) router.replace(redirectTo);
  }, [me, ok, redirectTo, router, allowedSerialized]);

  if (!me) return null; // AuthBoundary handles this case
  if (!ok) {
    if (redirectTo) return null;
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <EmptyState
          icon={<ShieldAlert className="h-7 w-7" />}
          title="Ruxsat yo'q"
          description="Bu bo'limga kirish uchun sizning rolingiz yetarli emas. Iltimos, administrator bilan bog'laning."
        />
      </div>
    );
  }
  return <>{children}</>;
}
