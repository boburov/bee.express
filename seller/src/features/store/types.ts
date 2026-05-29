/**
 * Mirrors server/src/seller/stores/store.serializer.ts.
 */
export type StoreStatus = "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";

export interface OpeningDay {
  open: string;  // "09:00"
  close: string; // "22:00"
}

export type OpeningHours = Partial<{
  mon: OpeningDay;
  tue: OpeningDay;
  wed: OpeningDay;
  thu: OpeningDay;
  fri: OpeningDay;
  sat: OpeningDay;
  sun: OpeningDay;
}>;

export interface Store {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: StoreStatus;
  logoUrl: string | null;
  bannerUrl: string | null;
  inn: string | null;
  legalName: string | null;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryRadiusKm: number | null;
  deliveryBaseFee: number | null;
  deliveryPerKmFee: number | null;
  deliveryEtaMinutes: number | null;
  minOrderAmount: number | null;
  isOpen: boolean;
  openingHours: OpeningHours | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreDto {
  name: string;
  slug?: string;
  description?: string;
  inn?: string;
  legalName?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  deliveryRadiusKm?: number;
  deliveryBaseFee?: number;
  deliveryPerKmFee?: number;
  deliveryEtaMinutes?: number;
  minOrderAmount?: number;
  isOpen?: boolean;
  openingHours?: OpeningHours;
  logoUploadId?: string;
  bannerUploadId?: string;
}

export type UpdateStoreDto = Partial<CreateStoreDto>;
