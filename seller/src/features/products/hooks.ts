"use client";

import { useCallback, useEffect, useState } from "react";
import { sellerProductsApi } from "./api";
import type { ListProductsQuery, ProductDetail, ProductsListResponse } from "./types";

export function useSellerProducts(query: ListProductsQuery = {}) {
  const [data, setData] = useState<ProductsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await sellerProductsApi.list(query);
      setData(r);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q, query.status, query.categoryId, query.page, query.pageSize]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}

export function useSellerProduct(id: string | null | undefined) {
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) { setData(null); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const o = await sellerProductsApi.get(id);
      setData(o);
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload, setData };
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
