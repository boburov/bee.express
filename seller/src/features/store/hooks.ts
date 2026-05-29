"use client";

import { useCallback, useEffect, useState } from "react";
import { storeApi } from "./api";
import type { Store } from "./types";

/**
 * Loads the seller's own store. Returns `null` data (not error) when the
 * seller hasn't created one yet — the page renders a create form in that case.
 */
export function useMyStore() {
  const [data, setData] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const store = await storeApi.getMine();
      setData(store);
      setHasLoaded(true);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, hasLoaded, reload, setData };
}
