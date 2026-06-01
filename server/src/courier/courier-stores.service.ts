import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, parsePagination } from '../common/pagination';
import { boundingBox, decimalToNumber, haversineKm } from '../geo/geo';
import { PrismaService } from '../prisma/prisma.service';
import { CourierStoresQueryDto } from './dto/courier-stores-query.dto';

const DEFAULT_RADIUS_KM = 15;
/** How many bbox candidates to pull before the haversine refine in geo mode. */
const GEO_CANDIDATE_CAP = 200;

/**
 * Browse ACTIVE stores a courier can contract with, each annotated with the
 * courier's own contract status for that store ("none" / PENDING / ACTIVE /
 * REJECTED / REVOKED) so the UI can render the right CTA.
 */
@Injectable()
export class CourierStoresService {
  constructor(private readonly prisma: PrismaService) {}

  async listStores(courierId: string, query: CourierStoresQueryDto) {
    const { page, limit } = parsePagination(query);
    const hasGeo = query.lat !== undefined && query.lng !== undefined;

    const baseWhere: Prisma.StoreWhereInput = {
      status: 'ACTIVE',
      ...(query.q && { name: { contains: query.q } }),
    };

    let stores: StoreRow[];
    let total: number;

    if (hasGeo) {
      const radiusKm = query.radiusKm ?? DEFAULT_RADIUS_KM;
      const bb = boundingBox(query.lat!, query.lng!, radiusKm);
      const candidates = await this.prisma.store.findMany({
        where: {
          ...baseWhere,
          latitude: { gte: bb.latMin, lte: bb.latMax },
          longitude: { gte: bb.lngMin, lte: bb.lngMax },
        },
        select: STORE_SELECT,
        take: GEO_CANDIDATE_CAP,
      });
      const refined = candidates
        .map((s) => ({ s, d: this.distance(s, query.lat!, query.lng!) }))
        .filter((x) => x.d !== null && x.d <= radiusKm)
        .sort((a, b) => (a.d ?? Infinity) - (b.d ?? Infinity));
      total = refined.length;
      stores = refined
        .slice((page - 1) * limit, (page - 1) * limit + limit)
        .map((x) => ({ ...x.s, distanceKm: x.d }));
    } else {
      const [rows, count] = await Promise.all([
        this.prisma.store.findMany({
          where: baseWhere,
          select: STORE_SELECT,
          orderBy: { name: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.store.count({ where: baseWhere }),
      ]);
      total = count;
      stores = rows.map((s) => ({ ...s, distanceKm: null }));
    }

    // Annotate each store with this courier's contract (if any).
    const contracts = await this.prisma.courierContract.findMany({
      where: { courierId, storeId: { in: stores.map((s) => s.id) } },
      select: { id: true, storeId: true, status: true, isTemporary: true },
    });
    const byStore = new Map(contracts.map((c) => [c.storeId, c]));

    const data = stores.map((s) => {
      const c = byStore.get(s.id);
      return {
        id: s.id,
        slug: s.slug,
        name: s.name,
        logoUrl: s.logoUrl,
        address: s.address,
        latitude: decimalToNumber(s.latitude),
        longitude: decimalToNumber(s.longitude),
        distanceKm: s.distanceKm,
        contract: c
          ? { id: c.id, status: c.status, isTemporary: c.isTemporary }
          : null,
      };
    });

    return paginated(data, total, page, limit);
  }

  private distance(s: StoreRow, lat: number, lng: number): number | null {
    const sLat = decimalToNumber(s.latitude);
    const sLng = decimalToNumber(s.longitude);
    if (sLat === null || sLng === null) return null;
    return Math.round(haversineKm({ lat, lng }, { lat: sLat, lng: sLng }) * 10) / 10;
  }
}

const STORE_SELECT = {
  id: true,
  slug: true,
  name: true,
  logoUrl: true,
  address: true,
  latitude: true,
  longitude: true,
} satisfies Prisma.StoreSelect;

type StoreRow = Prisma.StoreGetPayload<{ select: typeof STORE_SELECT }> & {
  distanceKm?: number | null;
};
