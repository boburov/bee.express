"use client";

import { AlertTriangle, CheckCircle2, Info, Megaphone, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useNotifications } from "./NotificationsProvider";
import type { NotificationType } from "./types";

const toneByType: Record<
  NotificationType,
  { bg: string; border: string; text: string; icon: React.FC<{ className?: string }> }
> = {
  INFO:     { bg: "bg-sky-50",   border: "border-sky-100",   text: "text-sky-700",   icon: Info },
  SUCCESS:  { bg: "bg-green-50", border: "border-green-100", text: "text-green-700", icon: CheckCircle2 },
  WARNING:  { bg: "bg-amber-50", border: "border-amber-100", text: "text-amber-800", icon: AlertTriangle },
  DANGER:   { bg: "bg-red-50",   border: "border-red-100",   text: "text-red-700",   icon: ShieldAlert },
  ANNOUNCE: { bg: "bg-brand-50", border: "border-brand-100", text: "text-brand-700", icon: Megaphone },
};

/** Fixed toast stack for incoming notifications (5s poll → see provider). */
export function ToastStack() {
  const { toasts, dismissToast } = useNotifications();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-full">
      {toasts.map((t) => {
        const tone = toneByType[t.type] ?? toneByType.INFO;
        const Icon = tone.icon;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex gap-3 rounded-xl border bg-surface shadow-card p-3.5",
              tone.border,
            )}
          >
            <span
              className={cn(
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                tone.bg,
                tone.text,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-ink truncate">{t.title}</h4>
              {t.body ? (
                <p className="text-xs text-ink-muted mt-0.5 line-clamp-3">{t.body}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Yopish"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-surface-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
