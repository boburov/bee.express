import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsQueryDto } from './dto/list-reviews-query.dto';

/**
 * Reviews are "verified buyer" gated — the buyer's Order must be DELIVERED.
 * The orders module doesn't exist yet, so v1 accepts any authenticated user
 * and stamps `verified: false`. When Order ships, we'll:
 *   1. require `orderId`,
 *   2. look up Order.userId === actor.id && status === 'DELIVERED',
 *   3. set `verified: true` on the row.
 *
 * The product's cached aggregates (ratingAvg, ratingCount) are recomputed in
 * the same transaction. For high write volume we'll move this to a queue.
 */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  async list(query: ListReviewsQueryDto) {
    if (!query.productId && !query.storeId) {
      throw new BadRequestException('productId yoki storeId majburiy.');
    }
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;

    const where: Prisma.ReviewWhereInput = {
      isVisible: true,
      ...(query.productId && { productId: query.productId }),
      ...(query.storeId && { storeId: query.storeId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          rating: true,
          text: true,
          imageUrls: true,
          verified: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, telegramUsername: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        ...r,
        // Strip identifying info, surface "Akmal R." style.
        author: this.authorLabel(r.user),
        user: undefined,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(dto: CreateReviewDto, userId: string) {
    // Confirm product + store exist and the store actually carries the product.
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, variants: { select: { id: true } } },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');

    const variantIds = product.variants.map((v) => v.id);
    const carries = await this.prisma.sellerOffer.findFirst({
      where: { storeId: dto.storeId, variantId: { in: variantIds } },
      select: { id: true },
    });
    if (!carries) {
      throw new BadRequestException("Tanlangan do'kon bu mahsulotni sotmaydi");
    }

    // Resolve review images (validate purpose).
    let imageUrls: string[] = [];
    if (dto.imageUploadIds && dto.imageUploadIds.length > 0) {
      for (const id of dto.imageUploadIds) {
        const u = await this.uploads.getReadyOrThrow(id, userId);
        if (u.purpose !== 'REVIEW_IMAGE') {
          throw new BadRequestException(
            `Upload ${id} REVIEW_IMAGE purpose bilan emas.`,
          );
        }
        imageUrls.push(u.url!);
      }
    }

    // TODO(orders): verify the buyer actually received this product via dto.orderId.
    const verified = false;

    try {
      const review = await this.prisma.$transaction(async (tx) => {
        const created = await tx.review.create({
          data: {
            productId: dto.productId,
            storeId: dto.storeId,
            userId,
            orderId: dto.orderId ?? null,
            rating: dto.rating,
            text: dto.text ?? null,
            imageUrls: imageUrls as Prisma.InputJsonValue,
            verified,
            isVisible: true,
          },
        });

        // Recompute product aggregates.
        const agg = await tx.review.aggregate({
          where: { productId: dto.productId, isVisible: true },
          _avg: { rating: true },
          _count: { _all: true },
        });
        await tx.product.update({
          where: { id: dto.productId },
          data: {
            ratingAvg: agg._avg.rating ?? 0,
            ratingCount: agg._count._all,
          },
        });
        return created;
      });

      // Attach uploads
      if (dto.imageUploadIds) {
        for (const id of dto.imageUploadIds) {
          await this.uploads.attach(id, 'review', review.id);
        }
      }

      return review;
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === 'P2002') {
        throw new ConflictException(
          'Bu mahsulot uchun allaqachon sharh qoldirgansiz. Tahrirlash uchun /reviews/:id PATCH.',
        );
      }
      throw err;
    }
  }

  private authorLabel(user: { firstName: string | null; lastName: string | null; telegramUsername: string | null }): string {
    if (user.firstName) {
      return `${user.firstName} ${user.lastName ? user.lastName.charAt(0) + '.' : ''}`.trim();
    }
    if (user.telegramUsername) return `@${user.telegramUsername}`;
    return 'Anonim';
  }
}
