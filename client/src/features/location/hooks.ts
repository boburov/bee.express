"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/shared/auth/store";
import { addressesApi } from "@/features/addresses/api";
import { useLocationStore, type ActiveLocation } from "./store";

/**
 * Seeds the active browsing location from the buyer's default address the
 * first time it's missing. Mount once high in the tree (AppShell) so every
 * discovery page can read geo without each one fetching addresses.
 *
 * Re-checks on navigation (pathname dep) while unseeded — so a first-time
 * user who just added an address gets picked up without a full reload. Once
 * a location exists the effect short-circuits and never fetches again.
 */
export function useEnsureLocation() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useLocationStore((s) => s.hydrated);
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const pathname = usePathname();

  useEffect(() => {
    if (!accessToken || !hydrated || location) return;
    let cancelled = false;
    addressesApi
      .list()
      .then((list) => {
        if (cancelled || list.length === 0) return;
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def) {
          setLocation({
            lat: def.latitude,
            lng: def.longitude,
            label: def.label,
            addressId: def.id,
          });
        }
      })
      .catch(() => {
        // Best-effort: a failed fetch just leaves discovery in the
        // "no location" state, which renders the address prompt.
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, hydrated, location, setLocation, pathname]);
}

/** Read-only accessor for pages that just need the active location. */
export function useActiveLocation(): ActiveLocation | null {
  return useLocationStore((s) => s.location);
}
