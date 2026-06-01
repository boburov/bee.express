import type { StatusMeta } from "@/features/deliveries/status";
import type { ContractStatus } from "./types";

export const CONTRACT_STATUS_META: Record<ContractStatus, StatusMeta> = {
  PENDING: { label: "So'rov yuborilgan", tone: "info" },
  ACTIVE: { label: "Faol", tone: "success" },
  REJECTED: { label: "Rad etilgan", tone: "danger" },
  REVOKED: { label: "To'xtatilgan", tone: "neutral" },
};
