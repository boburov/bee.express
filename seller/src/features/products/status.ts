import type { ProductStatus } from "./types";

export interface StatusMeta {
  label: string;
  tone: "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";
}

export const PRODUCT_STATUS_META: Record<ProductStatus, StatusMeta> = {
  DRAFT:    { label: "Qoralama",    tone: "neutral" },
  PENDING:  { label: "Moderatsiyada", tone: "info" },
  ACTIVE:   { label: "Faol",        tone: "success" },
  REJECTED: { label: "Rad etilgan", tone: "danger" },
  ARCHIVED: { label: "Arxivlangan", tone: "warning" },
};

export const PRODUCT_STATUS_LIST: ProductStatus[] = [
  "DRAFT", "PENDING", "ACTIVE", "REJECTED", "ARCHIVED",
];
