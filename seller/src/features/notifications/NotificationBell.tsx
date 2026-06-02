"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useNotifications } from "./NotificationsProvider";

/** Bell with unread badge + dropdown list. Polling lives in the provider. */
export function NotificationBell() {
  const { unread, items, loadingList, refreshList, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    void refreshList();
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, refreshList]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Bildirishnomalar${unread ? ` (${unread})` : ""}`}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-surface-3 hover:text-ink"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unread > 0 ? (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-surface shadow-card z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
            <span className="text-sm font-semibold text-ink">Bildirishnomalar</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-xs font-medium text-brand-700 hover:underline"
              >
                Hammasini o&apos;qildi
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loadingList && items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">Yuklanmoqda…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-muted">Bildirishnoma yo&apos;q</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!n.readAt) void markRead(n.id);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-surface-2 transition-colors",
                        !n.readAt && "bg-brand-50/40",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            !n.readAt ? "bg-brand-500" : "bg-transparent",
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink">{n.title}</p>
                          {n.body ? (
                            <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">{n.body}</p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
