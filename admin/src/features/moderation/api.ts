import { api } from "@/shared/auth/api";
import type {
  ActiveStore,
  Paginated,
  PendingApplication,
  PendingProduct,
  PendingStore,
} from "./types";

export interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
}

export interface ActiveStoreListQuery extends ListQuery {
  onlyFeatured?: boolean;
}

export const moderationApi = {
  // Products
  listProducts: async (params: ListQuery = {}): Promise<Paginated<PendingProduct>> => {
    const { data } = await api.get<Paginated<PendingProduct>>(
      "/admin/moderation/products",
      { params },
    );
    return data;
  },
  approveProduct: async (id: string): Promise<void> => {
    await api.post(`/admin/moderation/products/${id}/approve`);
  },
  rejectProduct: async (id: string, reason: string): Promise<void> => {
    await api.post(`/admin/moderation/products/${id}/reject`, { reason });
  },

  // Stores
  listStores: async (params: ListQuery = {}): Promise<Paginated<PendingStore>> => {
    const { data } = await api.get<Paginated<PendingStore>>(
      "/admin/moderation/stores",
      { params },
    );
    return data;
  },
  approveStore: async (id: string): Promise<void> => {
    await api.post(`/admin/moderation/stores/${id}/approve`);
  },
  rejectStore: async (id: string, reason: string): Promise<void> => {
    await api.post(`/admin/moderation/stores/${id}/reject`, { reason });
  },

  // Active stores + "Top restaurants" curation
  listActiveStores: async (
    params: ActiveStoreListQuery = {},
  ): Promise<Paginated<ActiveStore>> => {
    const { data } = await api.get<Paginated<ActiveStore>>(
      "/admin/moderation/stores/active",
      { params },
    );
    return data;
  },
  setStoreFeatured: async (
    id: string,
    body: { isFeatured: boolean; featuredRank?: number },
  ): Promise<ActiveStore> => {
    const { data } = await api.patch<ActiveStore>(
      `/admin/moderation/stores/${id}/featured`,
      body,
    );
    return data;
  },

  // Courier applications
  listApplications: async (
    params: ListQuery = {},
  ): Promise<Paginated<PendingApplication>> => {
    const { data } = await api.get<Paginated<PendingApplication>>(
      "/admin/moderation/courier-applications",
      { params },
    );
    return data;
  },
  approveApplication: async (id: string): Promise<void> => {
    await api.post(`/admin/moderation/courier-applications/${id}/approve`);
  },
  rejectApplication: async (id: string, reason: string): Promise<void> => {
    await api.post(`/admin/moderation/courier-applications/${id}/reject`, { reason });
  },
};
