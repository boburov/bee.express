export type ContractStatus = "PENDING" | "ACTIVE" | "REJECTED" | "REVOKED";

/** Mirrors server serializeContractForSeller. */
export interface SellerContract {
  id: string;
  status: ContractStatus;
  isTemporary: boolean;
  expiresAt: string | null;
  message: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  courier: {
    id: string;
    name: string | null;
    phone: string;
    transportType: string | null;
    isOnline: boolean;
  };
}
