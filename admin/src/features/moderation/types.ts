export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Product moderation ─────────────────────────────────────────────

export interface PendingProductOffer {
  id: string;
  variantId: string;
  storeId: string;
  price: number | null;
  oldPrice: number | null;
  stock: number;
  isActive: boolean;
  store: { id: string; name: string };
}

export interface PendingProductVariant {
  id: string;
  sku: string | null;
  offers: PendingProductOffer[];
}

export interface PendingProduct {
  id: string;
  slug: string;
  title: string;
  titleRu: string | null;
  description: string | null;
  ratingAvg: number;
  category: { id: string; slug: string; name: string; type: "FOOD" | "MARKETPLACE" };
  brand: { id: string; slug: string; name: string } | null;
  images: Array<{ id: string; url: string; alt: string | null }>;
  variants: PendingProductVariant[];
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string;
  } | null;
  createdAt: string;
}

// ─── Store moderation ───────────────────────────────────────────────

export interface PendingStore {
  id: string;
  slug: string;
  name: string;
  description: string | null;
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
  logoUrl: string | null;
  bannerUrl: string | null;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string;
  } | null;
  createdAt: string;
}

// ─── Active store curation ("Top restaurants") ──────────────────────

export interface ActiveStore {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  isOpen: boolean;
  isFeatured: boolean;
  featuredRank: number;
  createdAt: string;
}

// ─── Courier application moderation ──────────────────────────────────

export interface PendingApplication {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  transportType: string | null;
  fullName: string | null;
  note: string | null;
  documentUrls: string[];
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    phone: string;
  } | null;
}
