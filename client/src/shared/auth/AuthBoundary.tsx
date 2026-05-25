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
