"use client";

import { useCallback, useEffect, useState } from "react";
import type { Coords } from "@/lib/geolocation";
import { courierApi } from "./api";
import type {
  AvailableResponse,
  CourierOrder,
  CourierProfile,
  CourierStats,
  Paginated,
} from "./types";

export function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}

/** No websockets in this app — re-poll order data on this cadence instead. */
const POLL_MS = 15_000;

/** Available pool — re-fetches whenever the courier's coords change. */
export function useAvailableOrders(coords: Coords | null, radiusKm?: number) {
  const [data, setData] = useState<AvailableResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // `silent` skips the loading flag so background polls don't flash a spinner.
  const reload = useCallback(async (silent?: boolean) => {
    if (silent !== true) setLoading(true);
    setError(null);
    try {
      const r = await courierApi.available({
        lat: coords?.lat,
        lng: coords?.lng,
        radiusKm,
      });
      setData(r);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      if (silent !== true) setLoading(false);
    }
  }, [coords?.lat, coords?.lng, radiusKm]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Surface newly-READY orders entering the pool while the tab is visible.
  useEffect(() => {
    const t = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) reload(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  return { data, loading, error, reload };
}

export function useMyOrders(opts: { scope?: "active" | "history"; page?: number; limit?: number } = {}) {
  const [data, setData] = useState<Paginated<CourierOrder> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (silent?: boolean) => {
    if (silent !== true) setLoading(true);
    setError(null);
    try {
      const r = await courierApi.listMine(opts);
      setData(r);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      if (silent !== true) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.scope, opts.page, opts.limit]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Keep the courier's active orders current (auto-assign, releases) live-ish.
  useEffect(() => {
    const t = setInterval(() => {
      if (typeof document === "undefined" || !document.hidden) reload(true);
    }, POLL_MS);
    return () => clearInterval(t);
  }, [reload]);

  return { data, loading, error, reload };
}

export function useCourierOrder(id: string | null | undefined) {
  const [data, setData] = useState<CourierOrder | null>(null);
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
      setData(await courierApi.get(id));
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useCourierStats() {
  const [data, setData] = useState<CourierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await courierApi.stats());
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

export function useCourierProfile() {
  const [data, setData] = useState<CourierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await courierApi.getProfile());
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
