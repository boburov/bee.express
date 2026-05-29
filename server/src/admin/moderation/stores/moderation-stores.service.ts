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
