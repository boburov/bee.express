import { api } from "@/shared/auth/api";
import type { Order, OrderQuote, OrderStatus, Paginated } from "./types";

export interface CheckoutDto {
  addressId: string;
  notes?: string;
}

export const ordersApi = {
  quote: async (addressId: string): Promise<OrderQuote> => {
    const { data } = await api.post<OrderQuote>("/orders/quote", { addressId });
    return data;
  },
  checkout: async (dto: CheckoutDto): Promise<{ orders: Order[] }> => {
    const { data } = await api.post<{ orders: Order[] }>("/orders/checkout", dto);
    return data;
  },
  list: async (
    params: { page?: number; limit?: number; status?: OrderStatus } = {},
  ): Promise<Paginated<Order>> => {
    const { data } = await api.get<Paginated<Order>>("/orders", { params });
    return data;
  },
  get: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },
  cancel: async (id: string, reason?: string): Promise<Order> => {
    const { data } = await api.post<Order>(`/orders/${id}/cancel`, { reason });
    return data;
  },
};
