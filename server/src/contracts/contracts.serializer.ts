import type { Prisma } from '@prisma/client';

/**
 * A contract row joined with its store — the courier's view (they see which
 * store, not their own identity).
 */
export const CONTRACT_STORE_INCLUDE = {
  store: {
    select: {
      id: true,
      slug: true,
      name: true,
      logoUrl: true,
      address: true,
      status: true,
    },
  },
} satisfies Prisma.CourierContractInclude;

/**
 * A contract row joined with its courier (User) — the seller's view. We pull
 * `profile` to surface the courier's transport + online flag from
 * `profile.courier`.
 */
export const CONTRACT_COURIER_INCLUDE = {
  courier: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      profile: true,
    },
  },
} satisfies Prisma.CourierContractInclude;

type ContractWithStore = Prisma.CourierContractGetPayload<{
  include: typeof CONTRACT_STORE_INCLUDE;
}>;

type ContractWithCourier = Prisma.CourierContractGetPayload<{
  include: typeof CONTRACT_COURIER_INCLUDE;
}>;

interface ContractBase {
  id: string;
  status: ContractWithStore['status'];
  isTemporary: boolean;
  expiresAt: Date | null;
  message: string | null;
  rejectionReason: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function base(c: ContractBase) {
  return {
    id: c.id,
    status: c.status,
    isTemporary: c.isTemporary,
    expiresAt: c.expiresAt,
    message: c.message,
    rejectionReason: c.rejectionReason,
    approvedAt: c.approvedAt,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/** Courier-facing: "my contract with store X". */
export function serializeContractForCourier(c: ContractWithStore) {
  return {
    ...base(c),
    store: {
      id: c.store.id,
      slug: c.store.slug,
      name: c.store.name,
      logoUrl: c.store.logoUrl,
      address: c.store.address,
      status: c.store.status,
    },
  };
}

interface CourierProfileShape {
  transportType?: string | null;
  isOnline?: boolean;
}

function readCourierProfile(profile: Prisma.JsonValue | null): CourierProfileShape {
  if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
    const c = (profile as Record<string, unknown>).courier;
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      return c as CourierProfileShape;
    }
  }
  return {};
}

/** Seller-facing: "courier Y wants / has a contract with my store". */
export function serializeContractForSeller(c: ContractWithCourier) {
  const cp = readCourierProfile(c.courier.profile);
  const parts = [c.courier.firstName, c.courier.lastName].filter(Boolean);
  return {
    ...base(c),
    courier: {
      id: c.courier.id,
      name: parts.length ? parts.join(' ') : null,
      phone: c.courier.phone.toString(),
      transportType: cp.transportType ?? null,
      isOnline: cp.isOnline ?? false,
    },
  };
}

export type SerializedContractForCourier = ReturnType<
  typeof serializeContractForCourier
>;
export type SerializedContractForSeller = ReturnType<
  typeof serializeContractForSeller
>;
