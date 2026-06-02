"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/shared/auth/store";
import { addressesApi } from "@/features/addresses/api";
import { useLocationStore, type ActiveLocation } from "./store";

/**
 * Keeps the active browsing location in sync with its source address — NOT a
 * once-and-frozen seed. Mounted in AppShell; re-reconciles on navigation so an
 * edited/changed address is reflected (fixes "location set once never changes").
 * Follows the pointed-at address, else the default, else the first.
 */
export function useEnsureLocation() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useLocationStore((s) => s.hydrated);
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const pathname = usePathname();

  useEffect(() => {
    if (!accessToken || !hydrated) return;
    let cancelled = false;
    addressesApi
      .list()
      .then((list) => {
        if (cancelled || list.length === 0) return;
        // Follow the address the location points at (so editing its pin applies),
        // else the default, else the first.
        const target =
          (location?.addressId &&
            list.find((a) => a.id === location.addressId)) ||
          list.find((a) => a.isDefault) ||
          list[0];
        if (!target) return;
        // Only write when something drifted — avoids a render loop.
        if (
          !location ||
          location.addressId !== target.id ||
          location.lat !== target.latitude ||
          location.lng !== target.longitude ||
          location.label !== target.label
        ) {
          setLocation({
            lat: target.latitude,
            lng: target.longitude,
            label: target.label,
            addressId: target.id,
          });
        }
      })
      .catch(() => {
        // Best-effort: a failed fetch just leaves the prior location in place.
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
