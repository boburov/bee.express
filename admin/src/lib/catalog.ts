/**
 * Shared types and tiny API helpers for catalog pages.
 * Mirrors server/src/catalog/* response shapes.
 */
import { api } from "./api";

export type AttributeType = "SELECT" | "MULTI" | "NUMBER" | "TEXT" | "BOOL";

export const ATTRIBUTE_TYPE_LABELS: Record<AttributeType, string> = {
  SELECT: "Bitta tanlov (SELECT)",
  MULTI: "Ko'p tanlov (MULTI)",
  NUMBER: "Raqam",
  TEXT: "Matn",
  BOOL: "Ha/Yo'q",
};

export const ATTRIBUTE_TYPE_HAS_VALUES: Record<AttributeType, boolean> = {
  SELECT: true,
  MULTI: true,
  NUMBER: false,
  TEXT: false,
  BOOL: false,
};

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttributeValue {
  id: string;
  attributeId: string;
  value: string;
  label: string | null;
  hexColor: string | null;
  sortOrder: number;
}

export interface Attribute {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  type: AttributeType;
  unit: string | null;
  isFilterable: boolean;
  createdAt: string;
  _count?: { values: number; categories: number };
}

export interface AttributeDetail extends Attribute {
  values: AttributeValue[];
  categories: { categoryId: string; attributeId: string; isRequired: boolean; sortOrder: number; category: Category }[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  parentId: string | null;
  iconUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number; children: number; attributes: number };
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

export interface CategoryDetail extends Omit<Category, "_count"> {
  parent: Category | null;
  children: Category[];
  attributes: {
    categoryId: string;
    attributeId: string;
    isRequired: boolean;
    sortOrder: number;
    attribute: Attribute;
  }[];
  _count: { products: number };
}

// ─── Brand API ───
export const brandApi = {
  list: () => api.get<Brand[]>("/admin/brands").then((r) => r.data),
  create: (data: { name: string; slug?: string; logoUrl?: string; isActive?: boolean }) =>
    api.post<Brand>("/admin/brands", data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; slug: string; logoUrl: string | null; isActive: boolean }>) =>
    api.patch<Brand>(`/admin/brands/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/brands/${id}`),
};

// ─── Attribute API ───
export const attributeApi = {
  list: () => api.get<Attribute[]>("/admin/attributes").then((r) => r.data),
  get: (id: string) => api.get<AttributeDetail>(`/admin/attributes/${id}`).then((r) => r.data),
  create: (data: {
    name: string;
    nameRu?: string;
    slug?: string;
    type: AttributeType;
    unit?: string;
    isFilterable?: boolean;
  }) => api.post<Attribute>("/admin/attributes", data).then((r) => r.data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      nameRu: string | null;
      slug: string;
      type: AttributeType;
      unit: string | null;
      isFilterable: boolean;
    }>,
  ) => api.patch<Attribute>(`/admin/attributes/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/attributes/${id}`),
  addValue: (
    id: string,
    data: { value: string; label?: string; hexColor?: string; sortOrder?: number },
  ) => api.post<AttributeValue>(`/admin/attributes/${id}/values`, data).then((r) => r.data),
  updateValue: (
    id: string,
    valueId: string,
    data: Partial<{ value: string; label: string | null; hexColor: string | null; sortOrder: number }>,
  ) =>
    api
      .patch<AttributeValue>(`/admin/attributes/${id}/values/${valueId}`, data)
      .then((r) => r.data),
  removeValue: (id: string, valueId: string) =>
    api.delete(`/admin/attributes/${id}/values/${valueId}`),
};

// ─── Category API ───
export const categoryApi = {
  list: () => api.get<Category[]>("/admin/categories").then((r) => r.data),
  tree: () => api.get<CategoryNode[]>("/admin/categories/tree").then((r) => r.data),
  get: (id: string) => api.get<CategoryDetail>(`/admin/categories/${id}`).then((r) => r.data),
  create: (data: {
    name: string;
    nameRu?: string;
    slug?: string;
    parentId?: string;
    iconUrl?: string;
    imageUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }) => api.post<Category>("/admin/categories", data).then((r) => r.data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      nameRu: string | null;
      slug: string;
      parentId: string | null;
      iconUrl: string | null;
      imageUrl: string | null;
      sortOrder: number;
      isActive: boolean;
    }>,
  ) => api.patch<Category>(`/admin/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/categories/${id}`),
  attachAttribute: (
    categoryId: string,
    data: { attributeId: string; isRequired?: boolean; sortOrder?: number },
  ) => api.post(`/admin/categories/${categoryId}/attributes`, data),
  detachAttribute: (categoryId: string, attributeId: string) =>
    api.delete(`/admin/categories/${categoryId}/attributes/${attributeId}`),
};

export function extractApiError(err: unknown): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const msg = e.response?.data?.message;
  if (Array.isArray(msg)) return msg[0] ?? "Xatolik";
  return typeof msg === "string" ? msg : "Xatolik yuz berdi";
}
