import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourierContractStatus, CourierPaymentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CONTRACT_COURIER_INCLUDE,
  CONTRACT_STORE_INCLUDE,
  serializeContractForCourier,
  serializeContractForSeller,
} from './contracts.serializer';

/** Temporary (pool-fallback) contracts live this long before dispatch ignores them. */
export const TEMPORARY_CONTRACT_DAYS = 14;

/**
 * Store↔courier contracts. Couriers request, sellers approve. An ACTIVE
 * (non-expired) contract makes a courier eligible for auto-dispatch from that
 * store (see DispatchService).
 */
@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ════════════════════════════════════════════════════════════════════
  // Courier side
  // ════════════════════════════════════════════════════════════════════

  /** Request (or re-request after a reject/revoke) a contract with a store. */
  async requestContract(courierId: string, storeId: string, message?: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, status: true, ownerId: true },
    });
    if (!store) throw new NotFoundException("Do'kon topilmadi");
    if (store.status !== 'ACTIVE') {
      throw new BadRequestException("Bu do'kon hozir kontrakt qabul qilmaydi");
    }

    const existing = await this.prisma.courierContract.findUnique({
      where: { courierId_storeId: { courierId, storeId } },
    });
    if (existing) {
      if (existing.status === 'ACTIVE') {
        throw new BadRequestException("Bu do'kon bilan allaqachon shartnomangiz bor");
      }
      if (existing.status === 'PENDING') {
        throw new BadRequestException("So'rovingiz ko'rib chiqilmoqda");
      }
      // REJECTED / REVOKED → reopen as a fresh PENDING request.
      await this.prisma.courierContract.update({
        where: { id: existing.id },
        data: {
          status: 'PENDING',
          message: message ?? null,
          rejectionReason: null,
          isTemporary: false,
          expiresAt: null,
          approvedAt: null,
        },
      });
      await this.notifySellerOfRequest(store.ownerId, courierId, store.name);
      return this.getForCourier(existing.id, courierId);
    }

    const created = await this.prisma.courierContract.create({
      data: { courierId, storeId, message: message ?? null },
    });
    await this.notifySellerOfRequest(store.ownerId, courierId, store.name);
    return this.getForCourier(created.id, courierId);
  }

  async listForCourier(courierId: string, status?: CourierContractStatus) {
    const rows = await this.prisma.courierContract.findMany({
      where: { courierId, ...(status && { status }) },
      include: CONTRACT_STORE_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map(serializeContractForCourier);
  }

  async getForCourier(id: string, courierId: string) {
    const c = await this.prisma.courierContract.findUnique({
      where: { id },
      include: CONTRACT_STORE_INCLUDE,
    });
    if (!c || c.courierId !== courierId) {
      throw new NotFoundException('Kontrakt topilmadi');
    }
    return serializeContractForCourier(c);
  }

  /** Courier ends their own contract (PENDING request or ACTIVE one). */
  async cancelByCourier(id: string, courierId: string, reason?: string) {
    const c = await this.prisma.courierContract.findUnique({ where: { id } });
    if (!c || c.courierId !== courierId) {
      throw new NotFoundException('Kontrakt topilmadi');
    }
    if (c.status !== 'PENDING' && c.status !== 'ACTIVE') {
      throw new BadRequestException('Bu kontraktni bekor qilib bo\'lmaydi');
    }
    await this.prisma.courierContract.update({
      where: { id },
      data: { status: 'REVOKED', rejectionReason: reason ?? null },
    });
    const store = await this.prisma.store.findUnique({
      where: { id: c.storeId },
      select: { ownerId: true, name: true },
    });
    if (store) {
      await this.notify(
        store.ownerId,
        'Kuryer kontraktni bekor qildi',
        `"${store.name}" bilan kontrakt bekor qilindi`,
        'INFO',
      );
    }
    return this.getForCourier(id, courierId);
  }

  // ════════════════════════════════════════════════════════════════════
  // Seller side
  // ════════════════════════════════════════════════════════════════════

  async listForStore(storeId: string, status?: CourierContractStatus) {
    const rows = await this.prisma.courierContract.findMany({
      where: { storeId, ...(status && { status }) },
      include: CONTRACT_COURIER_INCLUDE,
      // Pending requests first, then most-recently-touched.
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
    return rows.map(serializeContractForSeller);
  }

  async approve(id: string, storeId: string) {
    const c = await this.requireStoreContract(id, storeId);
    if (c.status !== 'PENDING') {
      throw new BadRequestException('Bu so\'rov ko\'rib chiqilgan');
    }
    await this.prisma.courierContract.update({
      where: { id },
      data: { status: 'ACTIVE', approvedAt: new Date(), rejectionReason: null },
    });
    await this.notify(
      c.courierId,
      'Kontrakt tasdiqlandi 🤝',
      'Do\'kon sizning kontrakt so\'rovingizni qabul qildi. Endi buyurtmalar sizga keladi.',
      'SUCCESS',
    );
    return this.getForStore(id, storeId);
  }

  async reject(id: string, storeId: string, reason: string) {
    const c = await this.requireStoreContract(id, storeId);
    if (c.status !== 'PENDING') {
      throw new BadRequestException('Bu so\'rov ko\'rib chiqilgan');
    }
    await this.prisma.courierContract.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });
    await this.notify(
      c.courierId,
      'Kontrakt rad etildi',
      reason,
      'WARNING',
    );
    return this.getForStore(id, storeId);
  }

  /** Seller ends an ACTIVE contract. */
  async revokeBySeller(id: string, storeId: string, reason?: string) {
    const c = await this.requireStoreContract(id, storeId);
    if (c.status !== 'ACTIVE' && c.status !== 'PENDING') {
      throw new BadRequestException('Bu kontraktni bekor qilib bo\'lmaydi');
    }
    await this.prisma.courierContract.update({
      where: { id },
      data: { status: 'REVOKED', rejectionReason: reason ?? null },
    });
    await this.notify(
      c.courierId,
      'Kontrakt to\'xtatildi',
      reason ?? 'Do\'kon kontraktni to\'xtatdi',
      'INFO',
    );
    return this.getForStore(id, storeId);
  }

  async getForStore(id: string, storeId: string) {
    const c = await this.prisma.courierContract.findUnique({
      where: { id },
      include: CONTRACT_COURIER_INCLUDE,
    });
    if (!c || c.storeId !== storeId) {
      throw new NotFoundException('Kontrakt topilmadi');
    }
    return serializeContractForSeller(c);
  }

  /** Seller sets how this courier is paid per delivery (Stabil/PER_ORDER/PERCENT). */
  async setPayment(
    id: string,
    storeId: string,
    paymentType: CourierPaymentType,
    paymentValue: number,
  ) {
    await this.requireStoreContract(id, storeId);
    await this.prisma.courierContract.update({
      where: { id },
      data: { paymentType, paymentValue },
    });
    return this.getForStore(id, storeId);
  }

  // ════════════════════════════════════════════════════════════════════
  // Dispatch helpers (used by DispatchService + CourierService fallback)
  // ════════════════════════════════════════════════════════════════════

  /**
   * Pool fallback: a non-contracted courier just claimed a READY order from
   * this store. If they have no contract yet, mint a TEMPORARY one so future
   * orders can route to them too. Never overrides an existing decision
   * (a REJECTED row stays rejected).
   */
  async ensureTemporaryContract(courierId: string, storeId: string) {
    const existing = await this.prisma.courierContract.findUnique({
      where: { courierId_storeId: { courierId, storeId } },
      select: { id: true },
    });
    if (existing) return;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + TEMPORARY_CONTRACT_DAYS);
    await this.prisma.courierContract.create({
      data: {
        courierId,
        storeId,
        status: 'ACTIVE',
        isTemporary: true,
        expiresAt,
        approvedAt: new Date(),
      },
    });
  }

  // ─── helpers ──────────────────────────────────────────────────────────

  private async requireStoreContract(id: string, storeId: string) {
    const c = await this.prisma.courierContract.findUnique({ where: { id } });
    if (!c || c.storeId !== storeId) {
      throw new NotFoundException('Kontrakt topilmadi');
    }
    return c;
  }

  private async notifySellerOfRequest(
    ownerId: string,
    courierId: string,
    storeName: string,
  ) {
    const courier = await this.prisma.user.findUnique({
      where: { id: courierId },
      select: { firstName: true, lastName: true },
    });
    const name =
      [courier?.firstName, courier?.lastName].filter(Boolean).join(' ') ||
      'Kuryer';
    await this.notify(
      ownerId,
      'Yangi kontrakt so\'rovi',
      `${name} "${storeName}" do'koni bilan kontrakt tuzmoqchi`,
      'INFO',
      { link: '/dashboard/contracts' },
    );
  }

  private async notify(
    userId: string,
    title: string,
    body: string,
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER' | 'ANNOUNCE',
    data?: Record<string, unknown>,
  ) {
    await this.notifications
      .send(
        { target: 'USER', userIds: [userId], title, body, type, data },
        { type: 'SYSTEM', id: null },
      )
      .catch(() => undefined);
  }
}

// keep Prisma import referenced for typing helpers above
void Prisma;
