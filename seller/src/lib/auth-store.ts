"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const SELLER_ROLE_SLUG = "seller";

export interface Me {
  type: "user" | "super_admin";
  id: string;
  username?: string | null;
  fullName?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: { id: string; slug: string; name: string } | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  accessExpiresAt: number | null;
  me: Me | null;
  hydrated: boolean;
  setTokens: (t: { accessToken: string; refreshToken: string; expiresIn: number }) => void;
  setMe: (me: Me | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accessExpiresAt: null,
      me: null,
      hydrated: false,
      setTokens: ({ accessToken, refreshToken, expiresIn }) =>
        set({
          accessToken,
          refreshToken,
          accessExpiresAt: Date.now() + expiresIn * 1000,
        }),
      setMe: (me) => set({ me }),
      clear: () =>
        set({ accessToken: null, refreshToken: null, accessExpiresAt: null, me: null }),
    }),
    {
      name: "bee-seller-auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export function hasSellerRole(me: Me | null): boolean {
  return me?.type === "user" && me.role?.slug === SELLER_ROLE_SLUG;
}
