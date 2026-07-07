"use client";

import { useCallback, useEffect, useState } from "react";
import { catalogApi } from "./api";
import type {
  CategoryDetail,
  CategoryNode,
  FeaturedStore,
  ListProductsQuery,
  NearbyStore,
  ProductDetail,
  ProductsListResponse,
  StoreMenu,
  StoreSummary,
} from "./types";

function useAsync<T, A>(
  fn: (arg: A) => Promise<T>,
  arg: A,
  enabled: boolean = true,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fn(arg);
      setData(res);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
    // arg is serialized into JSON; reload re-fires when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(arg), enabled]);

  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

export function useCategoriesTree() {
  return useAsync<CategoryNode[], void>(
    () => catalogApi.categoriesTree(),
    undefined,
  );
}

export function useCategory(slug: string | null | undefined) {
  return useAsync<CategoryDetail, string>(
    (s) => catalogApi.categoryBySlug(s),
    slug ?? "",
    Boolean(slug),
  );
}

export function useProducts(query: ListProductsQuery) {
  return useAsync<ProductsListResponse, ListProductsQuery>(
    (q) => catalogApi.products(q),
    query,
  );
}

export function useProduct(
  slug: string | null | undefined,
  geo?: { lat: number; lng: number },
) {
  return useAsync<ProductDetail, { slug: string; geo?: { lat: number; lng: number } }>(
    ({ slug: s, geo: g }) => catalogApi.productBySlug(s, g),
    { slug: slug ?? "", geo },
    Boolean(slug),
  );
}

export function useStoresNearby(
  geo: { lat: number; lng: number } | null,
  limit = 6,
) {
  return useAsync<NearbyStore[], { lat: number; lng: number; limit: number }>(
    (q) => catalogApi.storesNearby(q),
    { lat: geo?.lat ?? 0, lng: geo?.lng ?? 0, limit },
    Boolean(geo),
  );
}

export function useStores(
  geo?: { lat: number; lng: number } | null,
  limit = 30,
) {
  // General restaurant list — loads regardless of location (not radius-gated);
  // geo only sorts nearest-first and adds distance.
  return useAsync<StoreSummary[], { lat?: number; lng?: number; limit: number }>(
    (q) => catalogApi.storesList(q),
    { lat: geo?.lat, lng: geo?.lng, limit },
    true,
  );
}

export function useFeaturedStores(
  geo?: { lat: number; lng: number } | null,
  limit = 10,
) {
  // Featured is a curated shelf — it loads even without a location; geo only
  // enriches the cards with distance when available.
  return useAsync<FeaturedStore[], { lat?: number; lng?: number; limit: number }>(
    (q) => catalogApi.storesFeatured(q),
    { lat: geo?.lat, lng: geo?.lng, limit },
    true,
  );
}

export function useStoreMenu(
  slug: string | null | undefined,
  geo?: { lat: number; lng: number } | null,
) {
  return useAsync<StoreMenu, { slug: string; geo?: { lat: number; lng: number } }>(
    ({ slug: s, geo: g }) => catalogApi.storeMenu(s, g),
    { slug: slug ?? "", geo: geo ?? undefined },
    Boolean(slug),
  );
}
