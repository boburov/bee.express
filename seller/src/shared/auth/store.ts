"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Slug enforced by the seller panel. Server uses the same string for @Roles(). */
export const SELLER_ROLE_SLUG = "seller";

export interface Me {
  type: "user" | "super_admin";
  id: string;
  username?: string | null;
  fullName?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
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

/** A `Me` is a valid seller iff its user role slug matches SELLER_ROLE_SLUG. */
export function hasSellerRole(me: Me | null): boolean {
  return me?.type === "user" && me.role?.slug === SELLER_ROLE_SLUG;
}
