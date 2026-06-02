"use client";

import { useCallback, useEffect, useState } from "react";
import { ordersApi } from "./api";
import type { Order, OrderStatus, Paginated } from "./types";

/** No websockets in this app — re-poll order data on this cadence instead. */
const POLL_MS = 15_000;

interface UseOrdersOpts {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export function useOrders(opts: UseOrdersOpts = {}) {
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `silent` skips the loading flag so background polls don't flash a spinner.
  const reload = useCallback(async (silent?: boolean) => {
    if (silent !== true) setLoading(true);
    setError(null);
    try {
      const r = await ordersApi.list(opts);
      setData(r);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      if (silent !== true) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.page, opts.limit, opts.status]);

  useEffect(() => { reload(); }, [reload]);

  // Surface status changes the seller/courier make while the buyer watches.
  useEffect(() => {
    const t = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) reload(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  return { data, loading, error, reload };
}

export function useOrder(id: string | null | undefined) {
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (silent?: boolean) => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    if (silent !== true) setLoading(true);
    setError(null);
    try {
      const o = await ordersApi.get(id);
      setData(o);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      if (silent !== true) setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  // Live-ish order tracking: poll the detail so the buyer sees each status step.
  useEffect(() => {
    if (!id) return;
    const t = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) reload(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [reload, id]);

  return { data, loading, error, reload };
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
