import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Store } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Helper that resolves the **store owned by the current seller**. All seller-
 * scoped endpoints (products, offers, requests) call this first to avoid
 * scattering ownership checks across services.
 *
 * Sellers have exactly one store in v1 (per TZ §19.4 — multi-branch comes
 * later). When that changes, swap this for a `getStoreByIdAndOwner(...)`
 * variant.
 */
@Injectable()
export class SellerContext {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the seller's store or throws 404 — caller decides whether to allow PENDING. */
  async requireOwnStore(sellerId: string, options?: { allowPending?: boolean }): Promise<Store> {
    const store = await this.prisma.store.findFirst({
      where: { ownerId: sellerId },
      orderBy: { createdAt: 'desc' },
    });
    if (!store) throw new NotFoundException("Avval do'koningizni yarating");
    if (!options?.allowPending && store.status !== 'ACTIVE') {
      throw new ForbiddenException(
        "Do'koningiz hali tasdiqlanmagan. Admin tasdiqlashini kuting.",
      );
    }
    return store;
  }

  /** Lightweight variant — returns null if no store yet (used by GET /stores/me). */
  async findOwnStore(sellerId: string): Promise<Store | null> {
    return this.prisma.store.findFirst({
      where: { ownerId: sellerId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
