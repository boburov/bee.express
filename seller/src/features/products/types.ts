/**
 * Mirrors server/src/seller/products/products.service.ts list/get shapes.
 */
export type ProductStatus = "DRAFT" | "PENDING" | "ACTIVE" | "REJECTED" | "ARCHIVED";

export interface ProductOffer {
  id: string;
  variantId: string;
  storeId: string;
  price: string | number;
  oldPrice: string | number | null;
  stock: number;
  condition: "NEW" | "USED" | "REFURBISHED";
  isActive: boolean;
  deliveryDays: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string | null;
  isDefault: boolean;
  offers: ProductOffer[];
  options?: Array<{
    value: { id: string; value: string; label: string | null };
  }>;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}

export interface ProductListItem {
  id: string;
  slug: string;
  title: string;
  titleRu: string | null;
  status: ProductStatus;
  rejectionReason: string | null;
  ratingAvg: string | number;
  ratingCount: number;
  category: { id: string; slug: string; name: string; type: "FOOD" | "MARKETPLACE" };
  brand: { id: string; slug: string; name: string } | null;
  images: ProductImage[];
  variants: ProductVariant[];
  _count: { reviews: number };
  createdAt: string;
  publishedAt: string | null;
}

export interface ProductsListResponse {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductDetail extends Omit<ProductListItem, "_count"> {
  description: string | null;
  category: {
    id: string;
    slug: string;
    name: string;
    nameRu: string | null;
    type: "FOOD" | "MARKETPLACE";
  };
  attributeValues: Array<{
    attribute: { id: string; name: string; type: string };
    value: { id: string; value: string; label: string | null } | null;
    rawValue: string | null;
  }>;
}

export interface CreateProductDto {
  title: string;
  titleRu?: string;
  slug?: string;
  categoryId: string;
  brandId?: string;
  description?: string;
  imageUploadIds?: string[];
  price?: number;
  oldPrice?: number;
  stock?: number;
}

export type UpdateProductDto = Partial<Omit<CreateProductDto, "categoryId">>;

export interface ListProductsQuery {
  q?: string;
  status?: ProductStatus;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}
