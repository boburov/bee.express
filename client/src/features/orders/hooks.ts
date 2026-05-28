"use client";

import { useCallback, useEffect, useState } from "react";
import { ordersApi } from "./api";
import type { Order, OrderStatus, Paginated } from "./types";

interface UseOrdersOpts {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export function useOrders(opts: UseOrdersOpts = {}) {
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await ordersApi.list(opts);
      setData(r);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.page, opts.limit, opts.status]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}

export function useOrder(id: string | null | undefined) {
  const [data, setData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const o = await ordersApi.get(id);
      setData(o);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
