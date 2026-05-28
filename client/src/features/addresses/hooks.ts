"use client";

import { useCallback, useEffect, useState } from "react";
import { addressesApi } from "./api";
import type { Address } from "./types";

export function useAddresses() {
  const [data, setData] = useState<Address[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await addressesApi.list();
      setData(list);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
