"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const me = useAuthStore((s) => s.me);
  const setMe = useAuthStore((s) => s.setMe);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (!me) {
      api
        .get("/auth/me")
        .then((r) => setMe(r.data))
        .catch(() => {
          clear();
          router.replace("/login");
        });
    }
  }, [hydrated, accessToken, me, setMe, clear, router]);

  async function onLogout() {
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } finally {
      clear();
      router.replace("/login");
    }
  }

  if (!hydrated || !accessToken) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 border-b border-line bg-surface flex items-center justify-between px-4 sm:px-8">
        <Logo size={28} />
        <button
          onClick={onLogout}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          Chiqish
        </button>
      </header>
      <main className="flex-1 px-4 sm:px-8 py-8">{children}</main>
    </div>
  );
}
