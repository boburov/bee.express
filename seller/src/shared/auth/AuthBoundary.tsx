"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/shared/auth/api";
import { useAuthStore } from "@/shared/auth/store";
import { Spinner } from "@/shared/ui/Spinner";

interface AuthBoundaryProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Gates a subtree on a hydrated, authenticated session. Order:
 * 1) wait for zustand persist to hydrate (avoid SSR/CSR flash),
 * 2) no token → bounce to /login,
 * 3) token but no /me cached → fetch /auth/me; on failure clear + bounce,
 * 4) render children.
 *
 * UX-only — the server still enforces auth on every request.
 */
export function AuthBoundary({ children, redirectTo = "/login", fallback }: AuthBoundaryProps) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const me = useAuthStore((s) => s.me);
  const setMe = useAuthStore((s) => s.setMe);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace(redirectTo);
      return;
    }
    if (!me) {
      api
        .get("/auth/me")
        .then((r) => setMe(r.data))
        .catch(() => {
          clear();
          router.replace(redirectTo);
        });
    }
  }, [hydrated, accessToken, me, setMe, clear, router, redirectTo]);

  if (!hydrated || !accessToken || !me) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center bg-surface-2">
          <Spinner label="Yuklanmoqda..." />
        </div>
      )
    );
  }

  return <>{children}</>;
}
