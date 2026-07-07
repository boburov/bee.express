import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { decimalToNumber } from '../../../geo/geo';

interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
}

/**
 * Admin moderation pipeline for seller-created stores.
 *
 *   PENDING → ACTIVE     (approve, approvedAt = now)
 *   PENDING → REJECTED   (with reason; seller re-edits + bumps back to PENDING)
 *
 * Only ACTIVE stores can list products and accept orders. The seller's
 * own UI surfaces the rejection reason in the StatusBanner.
 */
@Injectable()
export class ModerationStoresService {
  constructor(private readonly prisma: PrismaService) {}

  async listPending(query: ListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: Prisma.StoreWhereInput = {
      status: 'PENDING',
      ...(query.q && { name: { contains: query.q } }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: rows.map((s) => ({
        ...s,
        latitude: decimalToNumber(s.latitude),
        longitude: decimalToNumber(s.longitude),
        deliveryBaseFee: decimalToNumber(s.deliveryBaseFee),
        deliveryPerKmFee: decimalToNumber(s.deliveryPerKmFee),
        minOrderAmount: decimalToNumber(s.minOrderAmount),
        owner: s.owner
          ? { ...s.owner, phone: s.owner.phone.toString() }
          : null,
      })),
      meta: {
        page,
        limit: pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * ACTIVE stores for the "Top restaurants" curation screen. `onlyFeatured`
   * narrows to the current featured shelf; otherwise all ACTIVE stores are
   * listed so an admin can search and promote one.
   */
  async listActive(query: ListQuery & { onlyFeatured?: boolean }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: Prisma.StoreWhereInput = {
      status: 'ACTIVE',
      ...(query.onlyFeatured && { isFeatured: true }),
      ...(query.q && { name: { contains: query.q } }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        // Featured first (by rank), then the rest newest-first.
        orderBy: [
          { isFeatured: 'desc' },
          { featuredRank: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
          bannerUrl: true,
          address: true,
          isOpen: true,
          isFeatured: true,
          featuredRank: true,
          createdAt: true,
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: rows,
      meta: {
        page,
        limit: pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  /** Promote/demote a store on the home slider, optionally setting its rank. */
  async setFeatured(id: string, dto: { isFeatured: boolean; featuredRank?: number }) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    if (store.status !== 'ACTIVE') {
      throw new BadRequestException(
        "Faqat ACTIVE do'konni TOP ro'yxatga qo'shish mumkin",
      );
    }
    return this.prisma.store.update({
      where: { id },
      data: {
        isFeatured: dto.isFeatured,
        // Keep an explicit rank when featuring; reset to 0 when removed.
        featuredRank: dto.isFeatured ? (dto.featuredRank ?? store.featuredRank ?? 0) : 0,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        isFeatured: true,
        featuredRank: true,
      },
    });
  }

  async approve(id: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    if (store.status !== 'PENDING') {
      throw new BadRequestException(
        `Bu do'kon ${store.status} holatida — moderatsiyada emas`,
      );
    }
    return this.prisma.store.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });
  }

  async reject(id: string, reason: string) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    if (store.status !== 'PENDING') {
      throw new BadRequestException(
        `Bu do'kon ${store.status} holatida — moderatsiyada emas`,
      );
    }
    return this.prisma.store.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });
  }
}
