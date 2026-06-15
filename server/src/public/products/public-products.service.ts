import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  boundingBox,
  computeDeliveryFee,
  decimalToNumber,
  DEFAULT_FOOD_RADIUS_KM,
  effectiveFoodRadiusKm,
  haversineKm,
  MAX_FOOD_RADIUS_KM,
} from '../../geo/geo';
import { isStoreOpenNow } from '../../common/store-hours';
import { PublicListProductsQueryDto } from './dto/list-products-query.dto';

export interface ListedOffer {
  offerId: string;
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeIsOpen: boolean;
  price: number;
  oldPrice: number | null;
  stock: number;
  // Set when the request supplied geo + the store has coords.
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
  categoryType: 'FOOD' | 'MARKETPLACE';
  brandSlug: string | null;
  // Best offer (lowest active price). UI uses this for the card; full list lives on detail.
  bestOffer: ListedOffer | null;
}

@Injectable()
export class PublicProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: PublicListProductsQueryDto): Promise<{
    items: ListedProduct[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 24;

    // Resolve category once — its `type` decides whether geo is mandatory.
    const category = query.categorySlug
      ? await this.prisma.category.findUnique({ where: { slug: query.categorySlug } })
      : null;
    if (query.categorySlug && !category) {
      throw new NotFoundException('Kategoriya topilmadi');
    }

    const geoProvided = query.lat !== undefined && query.lng !== undefined;
    if (category?.type === 'FOOD' && !geoProvided) {
      throw new BadRequestException(
        'FOOD kategoriyasi uchun lokatsiya (lat, lng) majburiy.',
      );
    }

    // Build the candidate store set for the user's location.
    // For FOOD a store is shown ONLY when it can actually take the order *now*
    // (manual `isOpen` flag + weekly `openingHours` schedule) AND the buyer
    // sits inside that store's own service radius (seller override → category
    // default → fallback). MARKETPLACE ships everywhere regardless of the
    // store's open/closed state, so geo there only feeds distance/fee display
    // and never removes a product from the list.
    //
    // NOTE: we deliberately DON'T filter `isOpen` in SQL — that would also
    // hide MARKETPLACE offers from a temporarily-closed store, which ships
    // anyway. The open/hours gate is applied below, FOOD-only.
    let nearbyStoreIds: string[] | null = null;
    const distanceByStore = new Map<string, number>();

    if (geoProvided) {
      const isFood = category?.type === 'FOOD';

      // Bounding-box scan size. When the buyer caps the search with `radiusKm`
      // we honour it; otherwise (FOOD) we scan as far as any store's own radius
      // could legally reach so we don't drop a far store that still covers them.
      const scanRadiusKm =
        query.radiusKm ?? (isFood ? MAX_FOOD_RADIUS_KM : DEFAULT_FOOD_RADIUS_KM);
      const bbox = boundingBox(query.lat!, query.lng!, scanRadiusKm);
      const candidates = await this.prisma.store.findMany({
        where: {
          status: 'ACTIVE',
          latitude: { gte: bbox.latMin, lte: bbox.latMax },
          longitude: { gte: bbox.lngMin, lte: bbox.lngMax },
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          deliveryRadiusKm: true,
          isOpen: true,
          openingHours: true,
        },
      });

      const within: string[] = [];
      for (const s of candidates) {
        const lat = decimalToNumber(s.latitude);
        const lng = decimalToNumber(s.longitude);
        if (lat === null || lng === null) continue;
        const d = haversineKm({ lat: query.lat!, lng: query.lng! }, { lat, lng });
        if (d > scanRadiusKm) continue;
        distanceByStore.set(s.id, d);

        if (isFood) {
          // FOOD must be orderable right now — a closed store (manual flag or
          // outside its weekly hours) can't fulfil, so don't surface it. This
          // mirrors the order-time check in OrdersService / stores nearby.
          if (!s.isOpen || !isStoreOpenNow(s.openingHours)) continue;
          // Seller's radius is the gate — a buyer outside it can't see the store.
          const serviceRadius = effectiveFoodRadiusKm(
            s.deliveryRadiusKm,
            category?.deliveryRadiusKm,
          );
          if (d <= serviceRadius) within.push(s.id);
        } else {
          within.push(s.id);
        }
      }
      // FOOD restricts the offer set to in-radius, open stores. MARKETPLACE
      // ships everywhere, so geo must NOT shrink which products are listed —
      // it only populates `distanceByStore` for the cards' distance/fee.
      nearbyStoreIds = isFood ? within : null;

      // FOOD with empty nearby = no result fast-path.
      if (isFood && within.length === 0) {
        return { items: [], total: 0, page, pageSize };
      }
    }

    // Build product filter.
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
      ...(query.categorySlug && { category: { slug: query.categorySlug } }),
      ...(query.brandSlug && { brand: { slug: query.brandSlug } }),
      ...(query.q && { title: { contains: query.q } }),
      // Only show products with at least one active+in-stock offer in nearby stores.
      variants: {
        some: {
          offers: {
            some: {
              isActive: true,
              stock: { gt: 0 },
              ...(nearbyStoreIds && { storeId: { in: nearbyStoreIds } }),
              ...(query.priceMin !== undefined && { price: { gte: query.priceMin } }),
              ...(query.priceMax !== undefined && { price: { lte: query.priceMax } }),
            },
          },
        },
      },
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (query.sort) {
        case 'rating_desc':
          return [{ ratingAvg: 'desc' }, { ratingCount: 'desc' }];
        case 'newest':
          return [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
        case 'price_asc':
        case 'price_desc':
        case 'distance_asc':
          // Price/distance sorts can't be done in SQL without a window join —
          // we sort the in-memory page by best-offer below.
          return [{ createdAt: 'desc' }];
        default:
          return [{ ratingAvg: 'desc' }, { createdAt: 'desc' }];
      }
    })();

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { slug: true, type: true } },
          brand: { select: { slug: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: {
            include: {
              offers: {
                where: {
                  isActive: true,
                  stock: { gt: 0 },
                  ...(nearbyStoreIds && { storeId: { in: nearbyStoreIds } }),
                  ...(query.priceMin !== undefined && { price: { gte: query.priceMin } }),
                  ...(query.priceMax !== undefined && { price: { lte: query.priceMax } }),
                },
                include: {
                  store: {
                    select: {
                      id: true, slug: true, name: true, isOpen: true,
                      latitude: true, longitude: true,
                      deliveryBaseFee: true, deliveryPerKmFee: true,
                      deliveryEtaMinutes: true,
                    },
                  },
                },
                orderBy: { price: 'asc' },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const categoryFee = {
      baseFee: decimalToNumber(category?.deliveryBaseFee ?? null),
      perKmFee: decimalToNumber(category?.deliveryPerKmFee ?? null),
    };

    const items: ListedProduct[] = rows.map((p) => {
      const allOffers = p.variants.flatMap((v) => v.offers);
      let bestOffer: ListedOffer | null = null;

      if (allOffers.length > 0) {
        // Pick "best" by lowest price; tie-break by nearest store when geo provided.
        const sorted = [...allOffers].sort((a, b) => {
          const dp = decimalToNumber(a.price)! - decimalToNumber(b.price)!;
          if (dp !== 0) return dp;
          const da = distanceByStore.get(a.storeId) ?? Infinity;
          const db = distanceByStore.get(b.storeId) ?? Infinity;
          return da - db;
        });
        const best = sorted[0];
        const dist = geoProvided ? (distanceByStore.get(best.storeId) ?? null) : null;
        const fee = dist !== null
          ? computeDeliveryFee(
              dist,
              {
                baseFee: decimalToNumber(best.store.deliveryBaseFee),
                perKmFee: decimalToNumber(best.store.deliveryPerKmFee),
              },
              categoryFee,
            )
          : null;
        bestOffer = {
          offerId: best.id,
          storeId: best.storeId,
          storeSlug: best.store.slug,
          storeName: best.store.name,
          storeIsOpen: best.store.isOpen,
          price: decimalToNumber(best.price)!,
          oldPrice: decimalToNumber(best.oldPrice),
          stock: best.stock,
          distanceKm: dist === null ? null : Math.round(dist * 10) / 10,
          deliveryFee: fee,
          deliveryEtaMinutes: best.store.deliveryEtaMinutes ?? null,
        };
      }

      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        imageUrl: p.images[0]?.url ?? null,
        ratingAvg: decimalToNumber(p.ratingAvg) ?? 0,
        ratingCount: p.ratingCount,
        categorySlug: p.category.slug,
        categoryType: p.category.type,
        brandSlug: p.brand?.slug ?? null,
        bestOffer,
      };
    });

    // In-memory re-sort for price/distance — only applies to the current page,
    // good enough for v1 (Meilisearch ranking comes later).
    if (query.sort === 'price_asc') {
      items.sort((a, b) => (a.bestOffer?.price ?? Infinity) - (b.bestOffer?.price ?? Infinity));
    } else if (query.sort === 'price_desc') {
      items.sort((a, b) => (b.bestOffer?.price ?? -Infinity) - (a.bestOffer?.price ?? -Infinity));
    } else if (query.sort === 'distance_asc' && geoProvided) {
      items.sort(
        (a, b) =>
          (a.bestOffer?.distanceKm ?? Infinity) - (b.bestOffer?.distanceKm ?? Infinity),
      );
    }

    return { items, total, page, pageSize };
  }

  async getBySlug(slug: string, geo?: { lat: number; lng: number }) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        attributeValues: { include: { attribute: true, value: true } },
        variants: {
          include: {
            options: { include: { attribute: true, value: true } },
            offers: {
              where: { isActive: true },
              include: {
                store: {
                  select: {
                    id: true, slug: true, name: true, isOpen: true, address: true,
                    latitude: true, longitude: true, openingHours: true,
                    deliveryBaseFee: true, deliveryPerKmFee: true,
                    deliveryEtaMinutes: true, deliveryRadiusKm: true,
                  },
                },
              },
              orderBy: { price: 'asc' },
            },
          },
        },
      },
    });
    if (!product || product.status !== 'ACTIVE') throw new NotFoundException('Mahsulot topilmadi');

    const categoryFee = {
      baseFee: decimalToNumber(product.category.deliveryBaseFee),
      perKmFee: decimalToNumber(product.category.deliveryPerKmFee),
    };

    const variants = product.variants.map((v) => ({
      ...v,
      offers: v.offers.map((o) => {
        const sLat = decimalToNumber(o.store.latitude);
        const sLng = decimalToNumber(o.store.longitude);
        const isFood = product.category.type === 'FOOD';

        // A FOOD store that can't take the order right now (manual `isOpen`
        // flag or outside its weekly hours) is treated like out-of-range:
        // shown for context but not orderable. MARKETPLACE ships regardless.
        const closedForFood =
          isFood && (!o.store.isOpen || !isStoreOpenNow(o.store.openingHours));

        let distanceKm: number | null = null;
        let deliveryFee: number | null = null;
        if (geo && sLat !== null && sLng !== null) {
          distanceKm = haversineKm(geo, { lat: sLat, lng: sLng });
          const outOfRadius =
            isFood &&
            distanceKm >
              effectiveFoodRadiusKm(
                o.store.deliveryRadiusKm,
                product.category.deliveryRadiusKm,
              );
          if (outOfRadius || closedForFood) {
            // FOOD offer unavailable (outside radius or store closed) —
            // signal no delivery fee and flag it.
            return {
              ...o,
              price: decimalToNumber(o.price),
              oldPrice: decimalToNumber(o.oldPrice),
              distanceKm: Math.round(distanceKm * 10) / 10,
              deliveryFee: null,
              outOfRange: true,
            };
          }
          deliveryFee = computeDeliveryFee(
            distanceKm,
            {
              baseFee: decimalToNumber(o.store.deliveryBaseFee),
              perKmFee: decimalToNumber(o.store.deliveryPerKmFee),
            },
            categoryFee,
          );
        }
        return {
          ...o,
          price: decimalToNumber(o.price),
          oldPrice: decimalToNumber(o.oldPrice),
          distanceKm: distanceKm === null ? null : Math.round(distanceKm * 10) / 10,
          // Without geo we can't fee/range-gate, but a closed FOOD store is
          // still un-orderable — flag it so the UI disables the buy action.
          deliveryFee: closedForFood ? null : deliveryFee,
          outOfRange: closedForFood,
        };
      }),
    }));

    return {
      ...product,
      ratingAvg: decimalToNumber(product.ratingAvg) ?? 0,
      variants,
    };
  }
}
