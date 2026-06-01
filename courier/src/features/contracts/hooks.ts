"use client";

import { useCallback, useEffect, useState } from "react";
import { extractMsg } from "@/features/deliveries/hooks";
import type { Coords } from "@/lib/geolocation";
import { contractsApi } from "./api";
import type { CourierContract, CourierStore, Paginated } from "./types";

/** Browse ACTIVE stores, annotated with this courier's contract status. */
export function useCourierStores(coords: Coords | null, q: string) {
  const [data, setData] = useState<Paginated<CourierStore> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await contractsApi.listStores({
          lat: coords?.lat,
          lng: coords?.lng,
          q: q.trim() || undefined,
        }),
      );
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, [coords?.lat, coords?.lng, q]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}

/** This courier's contracts (all statuses). */
export function useMyContracts() {
  const [data, setData] = useState<CourierContract[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await contractsApi.listContracts());
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
