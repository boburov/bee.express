"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuthStore, type Me } from "@/shared/auth/store";
import { EmptyState } from "@/shared/ui/EmptyState";

export type AllowedRole = "super_admin" | "admin" | "seller" | "courier" | "customer";

interface RoleGuardProps {
  children: React.ReactNode;
  /**
   * Allowed roles. Empty array means "any authenticated user" (any role or
   * even a role-less user). Use this for the customer panel which welcomes
   * any signed-in person without enforcing a specific slug.
   */
  allowed: AllowedRole[];
  redirectTo?: string;
}

export function matchRole(me: Me | null, allowed: AllowedRole[]): boolean {
  if (!me) return false;
  if (allowed.length === 0) return true;
  if (me.type === "super_admin") return allowed.includes("super_admin");
  const slug = me.role?.slug as AllowedRole | undefined;
  return !!slug && allowed.includes(slug);
}

export function RoleGuard({ children, allowed, redirectTo }: RoleGuardProps) {
  const router = useRouter();
  const me = useAuthStore((s) => s.me);
  const ok = matchRole(me, allowed);

  useEffect(() => {
    if (me && !ok && redirectTo) router.replace(redirectTo);
  }, [me, ok, redirectTo, router]);

  if (!me) return null;
  if (!ok) {
    if (redirectTo) return null;
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <EmptyState
          icon={<ShieldAlert className="h-7 w-7" />}
          title="Ruxsat yo'q"
          description="Bu bo'limga kirish uchun sizning rolingiz yetarli emas."
        />
      </div>
    );
  }
  return <>{children}</>;
}
