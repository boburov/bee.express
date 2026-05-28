import { api } from "@/shared/auth/api";
import type { Cart } from "./types";

export const cartApi = {
  get: async (): Promise<Cart> => {
    const { data } = await api.get<Cart>("/cart");
    return data;
  },
  addItem: async (offerId: string, qty: number): Promise<Cart> => {
    const { data } = await api.post<Cart>("/cart/items", { offerId, qty });
    return data;
  },
  updateQty: async (itemId: string, qty: number): Promise<Cart> => {
    const { data } = await api.patch<Cart>(`/cart/items/${itemId}`, { qty });
    return data;
  },
  removeItem: async (itemId: string): Promise<Cart> => {
    const { data } = await api.delete<Cart>(`/cart/items/${itemId}`);
    return data;
  },
  clear: async (): Promise<Cart> => {
    const { data } = await api.delete<Cart>("/cart");
    return data;
  },
};
