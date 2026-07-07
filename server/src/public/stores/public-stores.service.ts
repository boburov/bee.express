import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  boundingBox,
  computeDeliveryFee,
  decimalToNumber,
  effectiveFoodRadiusKm,
  haversineKm,
} from '../../geo/geo';
import { isStoreOpenNow } from '../../common/store-hours';

@Injectable()
export class PublicStoresService {
  constructor(private readonly prisma: PrismaService) {}

  async nearby(opts: { lat: number; lng: number; radiusKm: number; limit?: number }) {
    const limit = opts.limit ?? 30;
    const bbox = boundingBox(opts.lat, opts.lng, opts.radiusKm);
    const candidates = await this.prisma.store.findMany({
      where: {
        status: 'ACTIVE',
        isOpen: true,
        latitude: { gte: bbox.latMin, lte: bbox.latMax },
        longitude: { gte: bbox.lngMin, lte: bbox.lngMax },
      },
      take: limit * 3, // refine candidates allow extra
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        bannerUrl: true,
        address: true,
        latitude: true,
        longitude: true,
        deliveryEtaMinutes: true,
        deliveryBaseFee: true,
        deliveryRadiusKm: true,
        openingHours: true,
      },
    });

    const refined = candidates
      .map((s) => {
        const lat = decimalToNumber(s.latitude);
        const lng = decimalToNumber(s.longitude);
        if (lat === null || lng === null) return null;
        // Outside its working hours → don't surface (manual isOpen already filtered in SQL).
        if (!isStoreOpenNow(s.openingHours)) return null;
        const d = haversineKm({ lat: opts.lat, lng: opts.lng }, { lat, lng });
        // Buyer's "near me" cap AND the store's own service radius must hold —
        // a store that won't deliver this far should not surface.
        if (d > opts.radiusKm) return null;
        if (d > effectiveFoodRadiusKm(s.deliveryRadiusKm, null)) return null;
        return {
          id: s.id,
          slug: s.slug,
          name: s.name,
          logoUrl: s.logoUrl,
          bannerUrl: s.bannerUrl,
          address: s.address,
          deliveryEtaMinutes: s.deliveryEtaMinutes,
          deliveryBaseFee: decimalToNumber(s.deliveryBaseFee),
          distanceKm: Math.round(d * 10) / 10,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    // Attach each store's aggregated rating (verified/visible reviews).
    const ratings = await this.ratingsFor(refined.map((s) => s.id));
    return refined.map((s) => ({
      ...s,
      ratingAvg: ratings.get(s.id)?.avg ?? 0,
      ratingCount: ratings.get(s.id)?.count ?? 0,
    }));
  }

  async getBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        offers: {
          where: { isActive: true, stock: { gt: 0 } },
          take: 1, // existence check
          select: { id: true },
        },
      },
    });
    if (!store || store.status !== 'ACTIVE') {
      throw new NotFoundException("Do'kon topilmadi");
    }
    const rating = (await this.ratingsFor([store.id])).get(store.id);
    return {
      id: store.id,
      slug: store.slug,
      name: store.name,
      description: store.description,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      phone: store.phone,
      address: store.address,
      latitude: decimalToNumber(store.latitude),
      longitude: decimalToNumber(store.longitude),
      isOpen: store.isOpen,
      openingHours: store.openingHours,
      deliveryEtaMinutes: store.deliveryEtaMinutes,
      deliveryBaseFee: decimalToNumber(store.deliveryBaseFee),
      deliveryPerKmFee: decimalToNumber(store.deliveryPerKmFee),
      deliveryRadiusKm: store.deliveryRadiusKm,
      minOrderAmount: decimalToNumber(store.minOrderAmount),
      hasActiveOffers: store.offers.length > 0,
      ratingAvg: rating?.avg ?? 0,
      ratingCount: rating?.count ?? 0,
    };
  }

  /**
   * A single store's menu — every ACTIVE product that has an in-stock, active
   * offer at this store, grouped by its category (taomlar / ichimliklar /
   * desertlar…). This powers the "restaurant page": pick a store on the home
   * screen, then browse only that store's dishes.
   *
   * One item per product (the store's cheapest in-stock offer represents it);
   * the item carries an `offerId` so the client can add it straight to the
   * cart. `variantCount > 1` tells the UI to open the product page for the
   * full variant/offer picker instead of a one-tap add.
   */
  async menu(slug: string, geo?: { lat: number; lng: number }) {
    const store = await this.prisma.store.findUnique({ where: { slug } });
    if (!store || store.status !== 'ACTIVE') {
      throw new NotFoundException("Do'kon topilmadi");
    }

    // Deliverability + fee/distance for the header (real math, same as nearby).
    const sLat = decimalToNumber(store.latitude);
    const sLng = decimalToNumber(store.longitude);
    const openNow = store.isOpen && isStoreOpenNow(store.openingHours);
    let distanceKm: number | null = null;
    let deliveryFee: number | null = null;
    let deliverable = openNow;
    if (geo && sLat !== null && sLng !== null) {
      const d = haversineKm(geo, { lat: sLat, lng: sLng });
      const radius = effectiveFoodRadiusKm(store.deliveryRadiusKm, null);
      if (d > radius) deliverable = false;
      deliveryFee = computeDeliveryFee(
        d,
        {
          baseFee: decimalToNumber(store.deliveryBaseFee),
          perKmFee: decimalToNumber(store.deliveryPerKmFee),
        },
        { baseFee: null, perKmFee: null },
      );
      distanceKm = Math.round(d * 10) / 10;
    }

    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        variants: {
          some: {
            offers: { some: { storeId: store.id, isActive: true, stock: { gt: 0 } } },
          },
        },
      },
      include: {
        category: { select: { id: true, slug: true, name: true, sortOrder: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: {
          include: {
            offers: {
              where: { storeId: store.id, isActive: true, stock: { gt: 0 } },
              orderBy: { price: 'asc' },
            },
          },
        },
      },
    });

    type MenuItem = {
      productId: string;
      slug: string;
      title: string;
      description: string | null;
      imageUrl: string | null;
      ratingAvg: number;
      ratingCount: number;
      offerId: string;
      price: number;
      oldPrice: number | null;
      stock: number;
      variantCount: number;
    };
    const byCat = new Map<
      string,
      { id: string; slug: string; name: string; sortOrder: number; items: MenuItem[] }
    >();

    for (const p of products) {
      const offers = p.variants.flatMap((v) => v.offers);
      if (offers.length === 0) continue;
      // Cheapest in-stock offer at this store represents the dish.
      const best = offers.reduce((a, b) =>
        (decimalToNumber(a.price) ?? Infinity) <= (decimalToNumber(b.price) ?? Infinity) ? a : b,
      );
      const c = p.category;
      if (!byCat.has(c.id)) {
        byCat.set(c.id, { id: c.id, slug: c.slug, name: c.name, sortOrder: c.sortOrder, items: [] });
      }
      byCat.get(c.id)!.items.push({
        productId: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description,
        imageUrl: p.images[0]?.url ?? null,
        ratingAvg: decimalToNumber(p.ratingAvg) ?? 0,
        ratingCount: p.ratingCount,
        offerId: best.id,
        price: decimalToNumber(best.price)!,
        oldPrice: decimalToNumber(best.oldPrice),
        stock: best.stock,
        variantCount: p.variants.length,
      });
    }

    const categories = [...byCat.values()]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        items: c.items.sort((x, y) => x.title.localeCompare(y.title)),
      }));

    const rating = (await this.ratingsFor([store.id])).get(store.id);

    return {
      store: {
        id: store.id,
        slug: store.slug,
        name: store.name,
        description: store.description,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        phone: store.phone,
        address: store.address,
        isOpen: store.isOpen,
        openNow,
        deliverable,
        distanceKm,
        deliveryFee,
        deliveryEtaMinutes: store.deliveryEtaMinutes,
        deliveryBaseFee: decimalToNumber(store.deliveryBaseFee),
        minOrderAmount: decimalToNumber(store.minOrderAmount),
        ratingAvg: rating?.avg ?? 0,
        ratingCount: rating?.count ?? 0,
      },
      itemCount: categories.reduce((n, c) => n + c.items.length, 0),
      categories,
    };
  }

  /** Aggregate visible-review ratings for a set of stores → id → {avg,count}. */
  private async ratingsFor(
    storeIds: string[],
  ): Promise<Map<string, { avg: number; count: number }>> {
    const map = new Map<string, { avg: number; count: number }>();
    if (storeIds.length === 0) return map;
    const rows = await this.prisma.review.groupBy({
      by: ['storeId'],
      where: { storeId: { in: storeIds }, isVisible: true },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const r of rows) {
      map.set(r.storeId, {
        avg: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : 0,
        count: r._count._all,
      });
    }
    return map;
  }
}
