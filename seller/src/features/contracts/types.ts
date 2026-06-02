export type ContractStatus = "PENDING" | "ACTIVE" | "REJECTED" | "REVOKED";

/** How the courier is paid per delivery (seller-set). */
export type CourierPaymentType = "SALARY" | "PER_ORDER" | "PERCENT";

/** Mirrors server serializeContractForSeller. */
export interface SellerContract {
  id: string;
  status: ContractStatus;
  isTemporary: boolean;
  expiresAt: string | null;
  message: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  paymentType: CourierPaymentType;
  paymentValue: number | null;
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
