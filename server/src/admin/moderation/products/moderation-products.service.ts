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
 * Admin moderation pipeline for seller-created master products.
 *
 *   PENDING → ACTIVE     (approve, publishedAt = now)
 *   PENDING → REJECTED   (with reason; seller sees in detail page)
 *
 * Approved products immediately appear in the public catalog (Public catalog
 * service filters by status='ACTIVE'). Rejected products stay in the seller's
 * list with the reason; seller can edit + re-submit (edit bounces back to
 * PENDING via SellerProductsService).
 */
@Injectable()
export class ModerationProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPending(query: ListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: Prisma.ProductWhereInput = {
      status: 'PENDING',
      ...(query.q && { title: { contains: query.q } }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'asc' }, // oldest first — FIFO queue
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, slug: true, name: true, type: true } },
          brand: { select: { id: true, slug: true, name: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          createdBy: { select: { id: true, firstName: true, lastName: true, phone: true } },
          variants: {
            where: { isDefault: true },
            include: { offers: { include: { store: { select: { id: true, name: true } } } } },
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: rows.map((p) => ({
        ...p,
        createdBy: p.createdBy
          ? {
              ...p.createdBy,
              phone: p.createdBy.phone.toString(),
            }
          : null,
        ratingAvg: decimalToNumber(p.ratingAvg) ?? 0,
        variants: p.variants.map((v) => ({
          ...v,
          offers: v.offers.map((o) => ({
            ...o,
            price: decimalToNumber(o.price),
            oldPrice: decimalToNumber(o.oldPrice),
          })),
        })),
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
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    if (product.status !== 'PENDING') {
      throw new BadRequestException(
        `Bu mahsulot ${product.status} holatida — moderatsiyada emas`,
      );
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
        rejectionReason: null,
      },
    });
  }

  async reject(id: string, reason: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    if (product.status !== 'PENDING') {
      throw new BadRequestException(
        `Bu mahsulot ${product.status} holatida — moderatsiyada emas`,
      );
    }
    return this.prisma.product.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });
  }
}
