"use client";

import { create } from "zustand";
import { cartApi } from "./api";
import type { Cart } from "./types";

interface CartState {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  addItem: (offerId: string, qty: number) => Promise<void>;
  updateQty: (itemId: string, qty: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Single source of truth for the cart across the Mini App. Pages call
 * `fetch()` on mount; the BottomNav reads `itemCount` for the badge.
 *
 * Mutations replace the cart with the server response — no optimistic
 * updates yet, since the server's `priceChanged` flag and stock validation
 * need fresh authoritative data.
 */
export const useCartStore = create<CartState>((set) => ({
  cart: null,
  loading: false,
  error: null,
  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const cart = await cartApi.get();
      set({ cart, loading: false });
    } catch (err) {
      set({ loading: false, error: extractMsg(err) });
    }
  },
  addItem: async (offerId, qty) => {
    set({ loading: true, error: null });
    try {
      const cart = await cartApi.addItem(offerId, qty);
      set({ cart, loading: false });
    } catch (err) {
      set({ loading: false, error: extractMsg(err) });
      throw err;
    }
  },
  updateQty: async (itemId, qty) => {
    set({ loading: true, error: null });
    try {
      const cart = await cartApi.updateQty(itemId, qty);
      set({ cart, loading: false });
    } catch (err) {
      set({ loading: false, error: extractMsg(err) });
      throw err;
    }
  },
  removeItem: async (itemId) => {
    set({ loading: true, error: null });
    try {
      const cart = await cartApi.removeItem(itemId);
      set({ cart, loading: false });
    } catch (err) {
      set({ loading: false, error: extractMsg(err) });
      throw err;
    }
  },
  clear: async () => {
    set({ loading: true, error: null });
    try {
      const cart = await cartApi.clear();
      set({ cart, loading: false });
    } catch (err) {
      set({ loading: false, error: extractMsg(err) });
    }
  },
}));

function extractMsg(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
