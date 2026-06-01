import type { Paginated } from "@/features/deliveries/types";

export type { Paginated };

export type ContractStatus = "PENDING" | "ACTIVE" | "REJECTED" | "REVOKED";

/** Mirrors server serializeContractForCourier. */
export interface CourierContract {
  id: string;
  status: ContractStatus;
  isTemporary: boolean;
  expiresAt: string | null;
  message: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  store: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    address: string | null;
    status: string;
  };
}

export interface StoreContractRef {
  id: string;
  status: ContractStatus;
  isTemporary: boolean;
}

/** Mirrors server CourierStoresService.listStores row. */
export interface CourierStore {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  contract: StoreContractRef | null;
}
