import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductRequestDto } from './dto/create-request.dto';

/**
 * "I need this product" pings.
 *
 * Deduped per (productId, userId, storeId) via the unique index — pressing the
 * button again increments `count` and refreshes the timestamp instead of
 * creating duplicates.
 *
 * Notification dispatch (Telegram bot → seller) is wired later via the queue
 * module; for now we just persist the row.
 */
@Injectable()
export class ProductRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductRequestDto, userId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, status: true },
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException('Mahsulot topilmadi');
    }

    if (dto.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: dto.storeId },
        select: { id: true, status: true },
      });
      if (!store || store.status !== 'ACTIVE') {
        throw new NotFoundException("Tanlangan do'kon topilmadi");
      }
    }

    // Prisma's tuple-unique lookup requires non-null strings; for the
    // "any seller" case (storeId === null) we fall back to findFirst which
    // matches NULL with `equals: null`. MySQL treats two NULLs as distinct
    // in unique indexes, but we still de-dup the "any" bucket here so a
    // single user doesn't accumulate N rows for the same product.
    const existing = dto.storeId
      ? await this.prisma.productRequest.findUnique({
          where: {
            productId_userId_storeId: {
              productId: dto.productId,
              userId,
              storeId: dto.storeId,
            },
          },
        })
      : await this.prisma.productRequest.findFirst({
          where: { productId: dto.productId, userId, storeId: null },
        });

    if (existing) {
      return this.prisma.productRequest.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
          // Re-open dismissed/fulfilled requests when the user bumps them.
          status: existing.status === 'FULFILLED' ? 'NEW' : existing.status,
          note: dto.note ?? existing.note,
        },
      });
    }

    return this.prisma.productRequest.create({
      data: {
        productId: dto.productId,
        storeId: dto.storeId ?? null,
        userId,
        note: dto.note ?? null,
        status: 'NEW',
      },
    });
  }

  /** Buyer view — every request the current user has open. */
  async listMine(userId: string) {
    return this.prisma.productRequest.findMany({
      where: { userId },
      include: {
        product: { select: { id: true, slug: true, title: true } },
        store: { select: { id: true, slug: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Seller view — incoming requests for the seller's store. */
  async listForSeller(sellerId: string) {
    const store = await this.prisma.store.findFirst({ where: { ownerId: sellerId } });
    if (!store) return [];

    // Include requests targeted at this store + requests not targeting any store
    // but matching products the seller carries.
    return this.prisma.productRequest.findMany({
      where: {
        OR: [
          { storeId: store.id },
          { storeId: null, product: { variants: { some: { offers: { some: { storeId: store.id } } } } } },
        ],
      },
      include: {
        product: { select: { id: true, slug: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markFulfilled(id: string, sellerId: string) {
    const req = await this.prisma.productRequest.findUnique({
      where: { id },
      include: { store: { select: { ownerId: true } } },
    });
    if (!req) throw new NotFoundException('Request topilmadi');
    if (req.store && req.store.ownerId !== sellerId) {
      throw new BadRequestException('Bu request boshqa sotuvchiga tegishli');
    }
    return this.prisma.productRequest.update({
      where: { id },
      data: { status: 'FULFILLED', fulfilledAt: new Date() },
    });
  }
}
