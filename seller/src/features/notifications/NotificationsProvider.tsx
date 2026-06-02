"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuthStore } from "@/shared/auth/store";
import { notificationsApi } from "./api";
import { notificationLink } from "./types";
import type { AppNotification, ToastItem } from "./types";

/**
 * No websocket in this app — the bell + toasts are driven by a 5s poll of the
 * unread count. The list is fetched only when the count grows (to toast the
 * new ones) or when the bell is opened. Polling pauses while the tab is hidden.
 */
const POLL_MS = 5000;
const TOAST_TTL = 6000;

interface NotificationsCtx {
  unread: number;
  items: AppNotification[];
  toasts: ToastItem[];
  loadingList: boolean;
  refreshList: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismissToast: (id: string) => void;
}

const Ctx = createContext<NotificationsCtx | null>(null);

export function useNotifications(): NotificationsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);

  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const prevUnread = useRef<number | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
    const timer = timers.current[id];
    if (timer) {
      clearTimeout(timer);
      delete timers.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (n: AppNotification) => {
      setToasts((t) =>
        [
          ...t,
          {
            id: n.id,
            title: n.title || "Sizga xabarnoma bor",
            body: n.body,
            type: n.type,
            link: notificationLink(n.data),
          },
        ].slice(-4),
      );
      timers.current[n.id] = setTimeout(() => dismissToast(n.id), TOAST_TTL);
    },
    [dismissToast],
  );

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await notificationsApi.listMine({ pageSize: 12 });
      setItems(res.items);
      setUnread(res.unread);
      res.items.forEach((n) => seenIds.current.add(n.id));
    } catch {
      /* ignore — bell stays on last good data */
    } finally {
      setLoadingList(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setItems((arr) =>
        arr.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch {
      /* ignore */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      setItems((arr) => arr.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    let cancelled = false;

    async function tick() {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const { count } = await notificationsApi.unreadCount();
        if (cancelled) return;
        setUnread(count);

        const prev = prevUnread.current;
        if (prev === null) {
          // First poll — seed silently (don't toast the backlog).
          prevUnread.current = count;
          const res = await notificationsApi.listMine({ pageSize: 12 });
          if (cancelled) return;
          setItems(res.items);
          res.items.forEach((n) => seenIds.current.add(n.id));
          return;
        }

        if (count > prev) {
          const res = await notificationsApi.listMine({ pageSize: 12 });
          if (cancelled) return;
          setItems(res.items);
          const fresh = res.items.filter((n) => !n.readAt && !seenIds.current.has(n.id));
          fresh.forEach((n) => seenIds.current.add(n.id));
          fresh.slice(0, 3).forEach(pushToast);
        }
        prevUnread.current = count;
      } catch {
        /* ignore network blips */
      }
    }

    void tick();
    const interval = setInterval(() => void tick(), POLL_MS);
    const onVis = () => {
      if (!document.hidden) void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
    // On logout the panel layout (and this provider) unmounts, so state is
    // discarded — no explicit reset effect needed.
  }, [hydrated, accessToken, pushToast]);

  return (
    <Ctx.Provider
      value={{ unread, items, toasts, loadingList, refreshList, markRead, markAllRead, dismissToast }}
    >
      {children}
    </Ctx.Provider>
  );
}
