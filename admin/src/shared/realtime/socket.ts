"use client";

import { io, Socket } from "socket.io-client";
import { env } from "@/shared/config/env";

/**
 * Lazy-initialised Socket.IO client.
 *
 * The notification gateway lives on the API host's HTTP server — Socket.IO
 * upgrades the same connection, so we derive its URL from `apiBaseUrl` by
 * stripping the `/api` path suffix.
 *
 * We expose `getSocket(token)` instead of a module-level constant so that
 * token changes (refresh, logout) recycle the connection.
 */
let cached: Socket | null = null;
let cachedToken: string | null = null;

function wsBaseUrl(): string {
  // env.apiBaseUrl looks like "http://<host>/api"
  // → strip trailing /api so we point at the bare host.
  return env.apiBaseUrl.replace(/\/api\/?$/, "");
}

export function getSocket(token: string): Socket {
  // Token o'zgarmagan bo'lsa cached'ni qaytaramiz — socket.io o'zining
  // reconnect logikasi bilan qayta ulanadi. `cached.connected` ni tekshirish
  // har bir reconnect oynasida yangi socket yaratardi va eski'larining
  // reconnect taymerlari fonda davom etardi.
  if (cached && cachedToken === token) return cached;
  if (cached) {
    cached.removeAllListeners();
    cached.disconnect();
    cached = null;
  }
  cachedToken = token;
  cached = io(wsBaseUrl(), {
    path: "/socket.io",
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });
  return cached;
}

export function disconnectSocket(): void {
  if (cached) {
    cached.removeAllListeners();
    cached.disconnect();
    cached = null;
    cachedToken = null;
  }
}
