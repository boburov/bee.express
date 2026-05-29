"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/shared/auth/api";

/**
 * Reuses the public `/v1/categories/tree` endpoint for the product wizard
 * picker. Sellers don't have a seller-scoped categories endpoint — the tree
 * is the same data the buyer sees and the same source of truth.
 */
export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  type: "FOOD" | "MARKETPLACE";
  iconUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

export async function fetchCategoriesTree(): Promise<CategoryNode[]> {
  const { data } = await api.get<CategoryNode[]>("/v1/categories/tree");
  return data;
}

export function useCategoriesTree() {
  const [data, setData] = useState<CategoryNode[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tree = await fetchCategoriesTree();
      setData(tree);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || "Yuklanmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { data, loading, error, reload };
}

/** Flatten tree → list of [id, "Parent / Child / Grandchild"] strings. */
export function flattenCategories(
  nodes: CategoryNode[],
  prefix: string = "",
): Array<{ id: string; label: string; type: "FOOD" | "MARKETPLACE" }> {
  const out: Array<{ id: string; label: string; type: "FOOD" | "MARKETPLACE" }> = [];
  for (const n of nodes) {
    const label = prefix ? `${prefix} / ${n.name}` : n.name;
    // Only leaf categories are pickable — products live on leaves.
    if (n.children.length === 0) {
      out.push({ id: n.id, label, type: n.type });
    } else {
      out.push(...flattenCategories(n.children, label));
    }
  }
  return out;
}
