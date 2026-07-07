/**
 * Mirrors server/src/public/categories/public-categories.service.ts and
 * public-products.service.ts. Keep in sync if backend shapes change.
 */

export type CategoryType = "FOOD" | "MARKETPLACE";

// ─── Categories ─────────────────────────────────────────────────────

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  type: CategoryType;
  iconUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

export interface CategoryAttributeValue {
  id: string;
  value: string;
  label: string | null;
  hexColor: string | null;
  sortOrder: number;
}

export interface CategoryAttribute {
  attribute: {
    id: string;
    slug: string;
    name: string;
    nameRu: string | null;
    type: "SELECT" | "MULTI" | "NUMBER" | "TEXT" | "BOOL";
    unit: string | null;
    isFilterable: boolean;
    values: CategoryAttributeValue[];
  };
}

export interface CategoryDetail {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  type: CategoryType;
  iconUrl: string | null;
  imageUrl: string | null;
  parent: { id: string; slug: string; name: string } | null;
  children: Array<{
    id: string; slug: string; name: string; iconUrl: string | null; imageUrl: string | null; type: CategoryType;
  }>;
  attributes: CategoryAttribute[];
  deliveryBaseFee: number | null;
  deliveryPerKmFee: number | null;
  deliveryRadiusKm: number | null;
  minOrderAmount: number | null;
}

// ─── Products list ──────────────────────────────────────────────────

export interface ListedOffer {
  offerId: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeIsOpen: boolean;
  price: number;
  oldPrice: number | null;
  stock: number;
  distanceKm: number | null;
  deliveryFee: number | null;
  deliveryEtaMinutes: number | null;
}

export interface ListedProduct {
  id: string;
  slug: string;
  title: string;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  categorySlug: string;
  categoryType: CategoryType;
  brandSlug: string | null;
  bestOffer: ListedOffer | null;
}

export interface ProductsListResponse {
  items: ListedProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListProductsQuery {
  q?: string;
  categorySlug?: string;
  brandSlug?: string;
  priceMin?: number;
  priceMax?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  sort?: "rating_desc" | "newest" | "price_asc" | "price_desc" | "distance_asc";
  page?: number;
  pageSize?: number;
}

// ─── Nearby stores ──────────────────────────────────────────────────
// Mirrors server/src/public/stores/public-stores.service.ts `nearby()`.

export interface NearbyStore {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  address: string | null;
  deliveryEtaMinutes: number | null;
  deliveryBaseFee: number | null;
  distanceKm: number;
  ratingAvg: number;
  ratingCount: number;
}

// ─── Store menu (restaurant page) ───────────────────────────────────
// Mirrors server/src/public/stores/public-stores.service.ts `menu()`.

export interface StoreMenuItem {
  productId: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  /** The store's representative (cheapest in-stock) offer — added to cart. */
  offerId: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  /** >1 → open the product page for the full variant picker instead of 1-tap add. */
  variantCount: number;
}

export interface StoreMenuCategory {
  id: string;
  slug: string;
  name: string;
  items: StoreMenuItem[];
}

export interface StoreMenuHeader {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  phone: string | null;
  address: string | null;
  isOpen: boolean;
  openNow: boolean;
  deliverable: boolean;
  distanceKm: number | null;
  deliveryFee: number | null;
  deliveryEtaMinutes: number | null;
  deliveryBaseFee: number | null;
  minOrderAmount: number | null;
  ratingAvg: number;
  ratingCount: number;
}

export interface StoreMenu {
  store: StoreMenuHeader;
  itemCount: number;
  categories: StoreMenuCategory[];
}

// ─── Product detail ─────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface VariantOffer {
  id: string;
  storeId: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  isActive: boolean;
  distanceKm: number | null;
  deliveryFee: number | null;
  outOfRange: boolean;
  store: {
    id: string;
    slug: string;
    name: string;
    isOpen: boolean;
    address: string | null;
    deliveryEtaMinutes: number | null;
    deliveryRadiusKm: number | null;
  };
}

export interface ProductVariant {
  id: string;
  sku: string | null;
  isDefault: boolean;
  options: Array<{
    attribute: { id: string; slug: string; name: string };
    value: { id: string; value: string; label: string | null; hexColor: string | null };
  }>;
  offers: VariantOffer[];
}

export interface ProductDetail {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ratingAvg: number;
  ratingCount: number;
  category: {
    id: string;
    slug: string;
    name: string;
    type: CategoryType;
  };
  brand: { id: string; slug: string; name: string; logoUrl: string | null } | null;
  images: ProductImage[];
  attributeValues: Array<{
    attribute: { id: string; slug: string; name: string; unit: string | null };
    value: { id: string; value: string; label: string | null } | null;
    rawValue: string | null;
  }>;
  variants: ProductVariant[];
}
