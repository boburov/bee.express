import type { Store } from '@prisma/client';
import { decimalToNumber } from '../../geo/geo';

export interface SerializedStore {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: Store['status'];
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
  openingHours: unknown;
  rejectionReason: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeStore(s: Store): SerializedStore {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    status: s.status,
    logoUrl: s.logoUrl,
    bannerUrl: s.bannerUrl,
    inn: s.inn,
    legalName: s.legalName,
    phone: s.phone,
    address: s.address,
    latitude: decimalToNumber(s.latitude),
    longitude: decimalToNumber(s.longitude),
    deliveryRadiusKm: s.deliveryRadiusKm,
    deliveryBaseFee: decimalToNumber(s.deliveryBaseFee),
    deliveryPerKmFee: decimalToNumber(s.deliveryPerKmFee),
    deliveryEtaMinutes: s.deliveryEtaMinutes,
    minOrderAmount: decimalToNumber(s.minOrderAmount),
    isOpen: s.isOpen,
    openingHours: s.openingHours,
    rejectionReason: s.rejectionReason,
    approvedAt: s.approvedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}
