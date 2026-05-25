"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  useEffect(() => {
    if (!hydrated || !accessToken) {
      disconnectSocket();
      setConnected(false);
      return;
    }
    const socket = getSocket(accessToken);

    function onConnect() { setConnected(true); }
    function onDisconnect() { setConnected(false); }
    function onNew(payload: RealtimeNotification) {
      setToasts((prev) => [...prev, payload].slice(-4));
      // Auto-dismiss after 6s.
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== payload.id));
      }, 6000);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(RealtimeEvents.New, onNew);
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(RealtimeEvents.New, onNew);
    };
  }, [hydrated, accessToken]);

  function dismissToast(id: string) {
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
