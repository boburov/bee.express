import { api } from "@/shared/auth/api";
import type {
  CreateProductDto,
  ListProductsQuery,
  ProductDetail,
  ProductListItem,
  ProductsListResponse,
  UpdateProductDto,
} from "./types";

export const sellerProductsApi = {
  list: async (params: ListProductsQuery = {}): Promise<ProductsListResponse> => {
    const { data } = await api.get<ProductsListResponse>("/seller/products", { params });
    return data;
  },
  get: async (id: string): Promise<ProductDetail> => {
    const { data } = await api.get<ProductDetail>(`/seller/products/${id}`);
    return data;
  },
  create: async (dto: CreateProductDto): Promise<ProductListItem> => {
    const { data } = await api.post<ProductListItem>("/seller/products", dto);
    return data;
  },
  update: async (id: string, dto: UpdateProductDto): Promise<ProductDetail> => {
    const { data } = await api.patch<ProductDetail>(`/seller/products/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/seller/products/${id}`);
  },
};

// ─── Offers (price/stock per variant) ───────────────────────────────────

export interface UpdateOfferDto {
  price?: number;
  oldPrice?: number;
  stock?: number;
  isActive?: boolean;
}

export const sellerOffersApi = {
  update: async (id: string, dto: UpdateOfferDto): Promise<void> => {
    await api.patch(`/seller/offers/${id}`, dto);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/seller/offers/${id}`);
  },
};
