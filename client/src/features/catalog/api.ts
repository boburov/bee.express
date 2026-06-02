import { api } from "@/shared/auth/api";
import type {
  CategoryDetail,
  CategoryNode,
  ListProductsQuery,
  NearbyStore,
  ProductDetail,
  ProductsListResponse,
} from "./types";

/**
 * Public catalog API — `@Public()` server-side, no auth required.
 * Client sends auth header anyway (interceptor), backend ignores it.
 */
export const catalogApi = {
  categoriesTree: async (): Promise<CategoryNode[]> => {
    const { data } = await api.get<CategoryNode[]>("/v1/categories/tree");
    return data;
  },
  categoryBySlug: async (slug: string): Promise<CategoryDetail> => {
    const { data } = await api.get<CategoryDetail>(`/v1/categories/${slug}`);
    return data;
  },
  products: async (query: ListProductsQuery): Promise<ProductsListResponse> => {
    const { data } = await api.get<ProductsListResponse>("/v1/products", { params: query });
    return data;
  },
  productBySlug: async (
    slug: string,
    geo?: { lat: number; lng: number },
  ): Promise<ProductDetail> => {
    const { data } = await api.get<ProductDetail>(`/v1/products/${slug}`, {
      params: geo,
    });
    return data;
  },
  storesNearby: async (query: {
    lat: number;
    lng: number;
    radiusKm?: number;
    limit?: number;
  }): Promise<NearbyStore[]> => {
    const { data } = await api.get<NearbyStore[]>("/v1/stores/nearby", { params: query });
    return data;
  },
};
