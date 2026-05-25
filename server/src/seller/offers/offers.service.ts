import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber } from '../../geo/geo';
import { SellerContext } from '../seller-context';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

/**
 * Per-store offers. One row per (storeId, variantId) — duplicates are rejected
 * via the unique index at the DB layer; we surface a friendly 409 here.
 *
 * Auto-deactivate-on-zero-stock rule (TZ §7.2 "sanaladigan mahsulotlar"):
 * if stock drops to 0 we flip `isActive=false`. Sellers can manually re-enable
 * after restocking (or set stock>0 again which keeps isActive untouched).
 */
@Injectable()
export class SellerOffersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: SellerContext,
  ) {}

  async list(sellerId: string) {
    const store = await this.ctx.findOwnStore(sellerId);
    if (!store) return { items: [], storeId: null };

    const offers = await this.prisma.sellerOffer.findMany({
      where: { storeId: store.id },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                title: true,
                status: true,
                images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      storeId: store.id,
      items: offers.map((o) => ({
        ...o,
        price: decimalToNumber(o.price),
        oldPrice: decimalToNumber(o.oldPrice),
      })),
    };
  }

  async create(dto: CreateOfferDto, sellerId: string) {
    const store = await this.ctx.requireOwnStore(sellerId);

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
      include: { product: true },
    });
    if (!variant) throw new BadRequestException('Tanlangan variant topilmadi');

    // Seller can list offers only for products THEY created. v2: allow
    // selling other sellers' master products too.
    if (variant.product.createdById !== sellerId) {
      throw new BadRequestException(
        "Bu mahsulot sizniki emas. Avval mahsulotni o'zingiz qo'shing.",
      );
    }

    try {
      const offer = await this.prisma.sellerOffer.create({
        data: {
          storeId: store.id,
          variantId: dto.variantId,
          price: dto.price,
          oldPrice: dto.oldPrice ?? null,
          stock: dto.stock,
          condition: dto.condition ?? 'NEW',
          deliveryDays: dto.deliveryDays ?? null,
          isActive: (dto.isActive ?? true) && dto.stock > 0,
        },
      });
      return this.serialize(offer);
    } catch (err) {
      const e = err as { code?: string };
      if (e.code === 'P2002') {
        throw new ConflictException(
          'Bu variant uchun allaqachon offer mavjud. PATCH bilan tahrirlang.',
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateOfferDto, sellerId: string) {
    const offer = await this.prisma.sellerOffer.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!offer || offer.store.ownerId !== sellerId) {
      throw new NotFoundException('Offer topilmadi');
    }

    const nextStock = dto.stock ?? offer.stock;
    const nextActive =
      dto.isActive !== undefined
        ? dto.isActive && nextStock > 0
        : nextStock === 0
          ? false
          : offer.isActive;

    const data: Prisma.SellerOfferUpdateInput = {
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.oldPrice !== undefined && { oldPrice: dto.oldPrice }),
      ...(dto.stock !== undefined && { stock: dto.stock }),
      ...(dto.condition !== undefined && { condition: dto.condition }),
      ...(dto.deliveryDays !== undefined && { deliveryDays: dto.deliveryDays }),
      isActive: nextActive,
    };

    const updated = await this.prisma.sellerOffer.update({ where: { id }, data });
    return this.serialize(updated);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const offer = await this.prisma.sellerOffer.findUnique({
      where: { id },
      include: { store: true },
    });
    if (!offer || offer.store.ownerId !== sellerId) {
      throw new NotFoundException('Offer topilmadi');
    }
    await this.prisma.sellerOffer.delete({ where: { id } });
  }

  private serialize<T extends { price: unknown; oldPrice: unknown }>(o: T) {
    return {
      ...o,
      price: decimalToNumber(o.price as Prisma.Decimal | number | null),
      oldPrice: decimalToNumber(o.oldPrice as Prisma.Decimal | number | null),
    };
  }
}
