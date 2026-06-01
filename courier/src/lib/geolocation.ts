"use client";

import { useCallback, useEffect, useState } from "react";

export interface Coords {
  lat: number;
  lng: number;
}

interface GeoState {
  coords: Coords | null;
  loading: boolean;
  error: string | null;
}

/**
 * Thin wrapper over the browser Geolocation API. Couriers grant location once
 * and we re-use it (maximumAge 30s) for the available-orders distance math.
 * `request()` lets the UI re-prompt after a denial.
 */
export function useGeolocation(auto = true) {
  const [state, setState] = useState<GeoState>({
    coords: null,
    loading: auto,
    error: null,
  });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ coords: null, loading: false, error: "Geolokatsiya qo'llab-quvvatlanmaydi" });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          loading: false,
          error: null,
        }),
      (err) => setState({ coords: null, loading: false, error: geoMessage(err) }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);

  useEffect(() => {
    if (auto) request();
  }, [auto, request]);

  return { ...state, request };
}

function geoMessage(err: GeolocationPositionError): string {
  if (err.code === err.PERMISSION_DENIED) return "Joylashuvga ruxsat berilmadi";
  if (err.code === err.POSITION_UNAVAILABLE) return "Joylashuv aniqlanmadi";
  if (err.code === err.TIMEOUT) return "Joylashuv so'rovi vaqti tugadi";
  return "Joylashuvni olishda xatolik";
}
