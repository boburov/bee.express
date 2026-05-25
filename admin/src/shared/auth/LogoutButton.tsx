"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { api } from "@/shared/auth/api";
import { useAuthStore } from "@/shared/auth/store";
import { cn } from "@/shared/lib/cn";

interface LogoutButtonProps {
  className?: string;
  iconOnly?: boolean;
  label?: string;
}

export function LogoutButton({ className, iconOnly, label = "Chiqish" }: LogoutButtonProps) {
  const router = useRouter();
  const clear = useAuthStore((s) => s.clear);
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    const { refreshToken } = useAuthStore.getState();
    try {
      if (refreshToken) await api.post("/auth/logout", { refreshToken });
    } catch {
      /* server may already have revoked — proceed locally */
    } finally {
      clear();
      router.replace("/login");
    }
  }

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-2 rounded-md text-sm font-medium text-ink-muted transition-colors hover:bg-surface-3 hover:text-ink disabled:opacity-50",
        iconOnly ? "h-9 w-9 justify-center" : "h-9 px-3",
        className,
      )}
      aria-label={iconOnly ? label : undefined}
    >
      <LogOut className="h-4 w-4" />
      {iconOnly ? null : <span>{label}</span>}
    </button>
  );
}
