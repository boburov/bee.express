import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimalToNumber } from '../geo/geo';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

/** Hydrated cart shape — shared by getMine and the orders checkout flow. */
const CART_INCLUDE = {
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      offer: {
        include: {
          store: {
            select: {
              id: true,
              slug: true,
              name: true,
              logoUrl: true,
              latitude: true,
              longitude: true,
              isOpen: true,
              status: true,
            },
          },
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  images: { orderBy: { sortOrder: 'asc' as const }, take: 1 },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type HydratedCart = Prisma.CartGetPayload<{ include: typeof CART_INCLUDE }>;
type HydratedCartItem = HydratedCart['items'][number];

/**
 * Per-user cart. Lazy: row is created when the buyer adds their first item.
 *
 * Items hold a price snapshot. The live price is re-read at checkout and any
 * mismatch is surfaced to the UI (so users see "narx o'zgardi" instead of
 * being silently overcharged or undercharged).
 */
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /** Read the user's cart with hydrated items (offer + variant + product). */
  async getMine(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: CART_INCLUDE,
    });
    if (!cart) return this.empty();
    return this.serialize(cart);
  }

  async addItem(dto: AddCartItemDto, userId: string) {
    const offer = await this.prisma.sellerOffer.findUnique({
      where: { id: dto.offerId },
      include: {
        store: { select: { id: true, status: true, isOpen: true } },
      },
    });
    if (!offer || !offer.isActive) {
      throw new NotFoundException('Bu mahsulot hozir mavjud emas');
    }
    if (offer.store.status !== 'ACTIVE') {
      throw new BadRequestException("Do'kon hali faollashtirilmagan");
    }
    if (offer.stock < dto.qty) {
      throw new BadRequestException(
        `Qoldiq yetarli emas (mavjud: ${offer.stock} dona)`,
      );
    }

    // Upsert the cart, then upsert the item — add qty if it already exists.
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    await this.prisma.cartItem.upsert({
      where: { cartId_offerId: { cartId: cart.id, offerId: dto.offerId } },
      create: {
        cartId: cart.id,
        offerId: dto.offerId,
        qty: dto.qty,
        priceSnapshot: offer.price,
      },
      update: {
        qty: { increment: dto.qty },
        priceSnapshot: offer.price,
      },
    });

    return this.getMine(userId);
  }

  async updateItem(itemId: string, dto: UpdateCartItemDto, userId: string) {
    const item = await this.findOwnedItem(itemId, userId);

    const offer = await this.prisma.sellerOffer.findUnique({
      where: { id: item.offerId },
    });
    if (!offer || !offer.isActive) {
      throw new BadRequestException('Bu mahsulot endi mavjud emas — savatdan olib tashlang');
    }
    if (offer.stock < dto.qty) {
      throw new BadRequestException(
        `Qoldiq yetarli emas (mavjud: ${offer.stock} dona)`,
      );
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { qty: dto.qty, priceSnapshot: offer.price },
    });

    return this.getMine(userId);
  }

  async removeItem(itemId: string, userId: string) {
    await this.findOwnedItem(itemId, userId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getMine(userId);
  }

  async clear(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return this.empty();
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.empty();
  }

  // ─── helpers ────────────────────────────────────────────────────────

  private async findOwnedItem(itemId: string, userId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { userId: true } } },
    });
    if (!item) throw new NotFoundException('Savat elementi topilmadi');
    if (item.cart.userId !== userId) throw new ForbiddenException();
    return item;
  }

  serialize(cart: HydratedCart) {
    // Group items by store so the UI can render one section per seller.
    const groups = new Map<
      string,
      {
        store: {
          id: string;
          slug: string;
          name: string;
          logoUrl: string | null;
          isOpen: boolean;
          status: string;
        };
        items: ReturnType<typeof this.serializeItem>[];
        subtotal: number;
      }
    >();

    for (const item of cart.items) {
      const storeId = item.offer.store.id;
      const existing = groups.get(storeId);
      const serialized = this.serializeItem(item);
      if (existing) {
        existing.items.push(serialized);
        existing.subtotal += serialized.subtotal;
      } else {
        groups.set(storeId, {
          store: {
            id: item.offer.store.id,
            slug: item.offer.store.slug,
            name: item.offer.store.name,
            logoUrl: item.offer.store.logoUrl,
            isOpen: item.offer.store.isOpen,
            status: item.offer.store.status,
          },
          items: [serialized],
          subtotal: serialized.subtotal,
        });
      }
    }

    const stores = Array.from(groups.values());
    const subtotal = stores.reduce((sum, g) => sum + g.subtotal, 0);
    const itemCount = cart.items.reduce((sum, it) => sum + it.qty, 0);

    return {
      id: cart.id,
      itemCount,
      subtotal,
      stores,
      // Top-level flat item list — useful when the UI just wants a count badge.
      itemIds: cart.items.map((it) => it.id),
    };
  }

  private serializeItem(item: HydratedCartItem) {
    const price = decimalToNumber(item.priceSnapshot)!;
    const livePrice = decimalToNumber(item.offer.price)!;
    return {
      id: item.id,
      offerId: item.offerId,
      qty: item.qty,
      price,
      livePrice,
      priceChanged: price !== livePrice,
      stock: item.offer.stock,
      subtotal: price * item.qty,
      product: {
        id: item.offer.variant.product.id,
        slug: item.offer.variant.product.slug,
        title: item.offer.variant.product.title,
        image: item.offer.variant.product.images[0]?.url ?? null,
      },
      variant: {
        id: item.offer.variant.id,
        sku: item.offer.variant.sku,
      },
    };
  }

  private empty() {
    return {
      id: null,
      itemCount: 0,
      subtotal: 0,
      stores: [] as never[],
      itemIds: [] as string[],
    };
  }
}
