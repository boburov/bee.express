"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/shared/auth/store";
import { disconnectSocket, getSocket } from "./socket";
import { RealtimeEvents, type RealtimeNotification } from "./types";

interface RealtimeContextValue {
  connected: boolean;
  toasts: RealtimeNotification[];
  dismissToast: (id: string) => void;
}

const Ctx = createContext<RealtimeContextValue | null>(null);

/**
 * Wires the Socket.IO connection to the current access token. Listens for
 * `notification:new` and queues a transient toast (the consumer is the
 * <Toaster /> component lower in the tree).
 *
 * SuperAdmin sees broadcasts too (joined `broadcast` room server-side), so
 * the admin gets a live confirmation that their own send hit the bus.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<RealtimeNotification[]>([]);
  const dismissTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!hydrated || !accessToken) {
      disconnectSocket();
      setConnected(false);
      return;
    }
    const socket = getSocket(accessToken);
    const timers = dismissTimersRef.current;

    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }
    function onNew(payload: RealtimeNotification) {
      setToasts((prev) => [...prev, payload].slice(-4));
      // Auto-dismiss after 6s. Timer ref'da saqlanadi — unmount paytida
      // clear qilinadi, aks holda yopilgan komponentga setState chaqirib
      // memory'ni ushlab turadi.
      const handle = setTimeout(() => {
        timers.delete(payload.id);
        setToasts((prev) => prev.filter((t) => t.id !== payload.id));
      }, 6000);
      timers.set(payload.id, handle);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(RealtimeEvents.New, onNew);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(RealtimeEvents.New, onNew);
      timers.forEach((handle) => clearTimeout(handle));
      timers.clear();
    };
  }, [hydrated, accessToken]);

  function dismissToast(id: string) {
    const handle = dismissTimersRef.current.get(id);
    if (handle) {
      clearTimeout(handle);
      dismissTimersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <Ctx.Provider value={{ connected, toasts, dismissToast }}>
      {children}
    </Ctx.Provider>
  );
}

export function useRealtime(): RealtimeContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRealtime must be used inside <RealtimeProvider>");
  return v;
}
