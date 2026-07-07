"use client";

import { useCallback, useEffect, useState } from "react";
import { moderationApi, type ActiveStoreListQuery, type ListQuery } from "./api";
import type {
  ActiveStore,
  Paginated,
  PendingApplication,
  PendingProduct,
  PendingStore,
} from "./types";

export function usePendingProducts(query: ListQuery = {}) {
  const [data, setData] = useState<Paginated<PendingProduct> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await moderationApi.listProducts(query));
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.pageSize, query.q]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

export function usePendingStores(query: ListQuery = {}) {
  const [data, setData] = useState<Paginated<PendingStore> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await moderationApi.listStores(query));
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.pageSize, query.q]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

export function usePendingApplications(query: ListQuery = {}) {
  const [data, setData] = useState<Paginated<PendingApplication> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await moderationApi.listApplications(query));
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.pageSize, query.q]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

export function useActiveStores(query: ActiveStoreListQuery = {}) {
  const [data, setData] = useState<Paginated<ActiveStore> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await moderationApi.listActiveStores(query));
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.page, query.pageSize, query.q, query.onlyFeatured]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
