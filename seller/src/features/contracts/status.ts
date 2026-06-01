import type { StatusMeta } from "@/features/orders/status";
import type { ContractStatus } from "./types";

export const CONTRACT_STATUS_META: Record<ContractStatus, StatusMeta> = {
  PENDING: { label: "So'rov", tone: "info" },
  ACTIVE: { label: "Faol", tone: "success" },
  REJECTED: { label: "Rad etilgan", tone: "danger" },
  REVOKED: { label: "To'xtatilgan", tone: "neutral" },
};

export const CONTRACT_STATUS_FILTERS: { value: ContractStatus | undefined; label: string }[] = [
  { value: undefined, label: "Barchasi" },
  { value: "PENDING", label: "So'rovlar" },
  { value: "ACTIVE", label: "Faol" },
  { value: "REJECTED", label: "Rad etilgan" },
  { value: "REVOKED", label: "To'xtatilgan" },
];
