"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * The buyer's "near me" context. Discovery (home / category / product /
 * nearby-stores) reads this to filter FOOD listings and compute delivery
 * fees by distance. Seeded from the default address (see hooks.ts) and
 * persisted so it survives reloads inside the Mini App.
 */
export interface ActiveLocation {
  lat: number;
  lng: number;
  label: string;
  addressId: string | null;
}

interface LocationState {
  location: ActiveLocation | null;
  hydrated: boolean;
  setLocation: (loc: ActiveLocation) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      hydrated: false,
      setLocation: (location) => set({ location }),
      clear: () => set({ location: null }),
    }),
    {
      name: "bee-client-location",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
