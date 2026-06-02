import { api } from "@/shared/auth/api";
import type { Order, OrderStatus, Paginated } from "./types";

export interface UpdateStatusDto {
  status: OrderStatus;
  note?: string;
}

/**
 * Seller-scoped orders API. Backend enforces @Roles("seller") + only the
 * seller's own store's orders are visible.
 */
export const sellerOrdersApi = {
  list: async (
    params: { page?: number; limit?: number; status?: OrderStatus } = {},
  ): Promise<Paginated<Order>> => {
    const { data } = await api.get<Paginated<Order>>("/seller/orders", { params });
    return data;
  },
  get: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/seller/orders/${id}`);
    return data;
  },
  updateStatus: async (id: string, dto: UpdateStatusDto): Promise<Order> => {
    const { data } = await api.patch<Order>(`/seller/orders/${id}/status`, dto);
    return data;
  },
  assignCourier: async (id: string, courierId: string): Promise<Order> => {
    const { data } = await api.post<Order>(`/seller/orders/${id}/assign-courier`, {
      courierId,
    });
    return data;
  },
};
