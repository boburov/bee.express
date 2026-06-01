import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  boundingBox,
  decimalToNumber,
  effectiveFoodRadiusKm,
  haversineKm,
} from '../../geo/geo';

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
        latitude: true,
        longitude: true,
        deliveryEtaMinutes: true,
        deliveryBaseFee: true,
        deliveryRadiusKm: true,
      },
    });

    const refined = candidates
      .map((s) => {
        const lat = decimalToNumber(s.latitude);
        const lng = decimalToNumber(s.longitude);
        if (lat === null || lng === null) return null;
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
          deliveryEtaMinutes: s.deliveryEtaMinutes,
          deliveryBaseFee: decimalToNumber(s.deliveryBaseFee),
          distanceKm: Math.round(d * 10) / 10,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return refined;
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
    };
  }
}
