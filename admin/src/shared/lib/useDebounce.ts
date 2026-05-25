"use client";

import { useEffect, useState } from "react";

/**
 * Returns a debounced version of `value` that only updates after `delay` ms
 * of no further changes. Used by list-search inputs.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
