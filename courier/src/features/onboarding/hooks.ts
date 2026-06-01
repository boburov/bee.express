"use client";

import { useCallback, useEffect, useState } from "react";
import { extractMsg } from "@/features/deliveries/hooks";
import { onboardingApi } from "./api";
import type { OnboardingState } from "./types";

/**
 * Loads the current onboarding state ({ isCourier, application }). `enabled`
 * gates the fetch so the page can wait for auth hydration + a token before
 * hitting the API (avoids a spurious 401 on first paint).
 */
export function useOnboarding(enabled: boolean) {
  const [data, setData] = useState<OnboardingState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      setData(await onboardingApi.me());
    } catch (e) {
      setError(extractMsg(e));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
