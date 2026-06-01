import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourierApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../../notifications/notifications.service';

interface ListQuery {
  page?: number;
  pageSize?: number;
  q?: string;
}

const COURIER_ROLE_SLUG = 'courier';

/**
 * Admin moderation for courier applications.
 *
 *   PENDING → APPROVED   (grant the `courier` role; seed profile.courier)
 *   PENDING → REJECTED   (with reason; the applicant can re-apply)
 *
 * Approval is the gate that turns a plain user into a courier: it sets
 * `User.roleId` to the seeded `courier` role and seeds their transport into
 * `profile.courier` so CourierService.getProfile has something to show.
 */
@Injectable()
export class ModerationApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async listPending(query: ListQuery) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: Prisma.CourierApplicationWhereInput = {
      status: 'PENDING',
      ...(query.q && {
        OR: [
          { fullName: { contains: query.q } },
          { user: { firstName: { contains: query.q } } },
          { user: { lastName: { contains: query.q } } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      this.prisma.courierApplication.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      }),
      this.prisma.courierApplication.count({ where }),
    ]);

    return {
      data: rows.map((a) => this.serialize(a)),
      meta: {
        page,
        limit: pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
      },
    };
  }

  async approve(id: string, reviewedBy: string | null) {
    const application = await this.requirePending(id);

    const role = await this.prisma.role.findUnique({
      where: { slug: COURIER_ROLE_SLUG },
      select: { id: true },
    });
    if (!role) {
      throw new BadRequestException(
        "`courier` roli topilmadi — avval `npm run db:seed` ishga tushiring",
      );
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: application.userId },
      select: { profile: true },
    });

    await this.prisma.$transaction([
      this.prisma.courierApplication.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy,
          rejectionReason: null,
        },
      }),
      this.prisma.user.update({
        where: { id: application.userId },
        data: {
          roleId: role.id,
          profile: this.seedCourierProfile(
            user.profile,
            application.transportType,
          ),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorType: 'SUPER_ADMIN',
          actorId: reviewedBy,
          action: 'courier.application.approve',
          resource: 'courierApplication',
          resourceId: id,
          metadata: { userId: application.userId },
        },
      }),
    ]);

    await this.notifications
      .send(
        {
          target: 'USER',
          userIds: [application.userId],
          title: 'Kuryer arizangiz tasdiqlandi 🎉',
          body: "Endi kuryersiz — do'konlar bilan kontrakt tuzishingiz mumkin.",
          type: 'SUCCESS',
          data: { link: '/dashboard' },
        },
        { type: 'SUPER_ADMIN', id: reviewedBy },
      )
      .catch(() => undefined);

    return this.getById(id);
  }

  async reject(id: string, reason: string, reviewedBy: string | null) {
    const application = await this.requirePending(id);

    await this.prisma.courierApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy,
      },
    });

    await this.notifications
      .send(
        {
          target: 'USER',
          userIds: [application.userId],
          title: 'Kuryer arizangiz rad etildi',
          body: reason,
          type: 'WARNING',
        },
        { type: 'SUPER_ADMIN', id: reviewedBy },
      )
      .catch(() => undefined);

    return this.getById(id);
  }

  // ─── helpers ──────────────────────────────────────────────────────────

  private async requirePending(id: string) {
    const application = await this.prisma.courierApplication.findUnique({
      where: { id },
    });
    if (!application) throw new NotFoundException('Ariza topilmadi');
    if (application.status !== 'PENDING') {
      throw new BadRequestException(
        `Bu ariza ${application.status} holatida — moderatsiyada emas`,
      );
    }
    return application;
  }

  private async getById(id: string) {
    const a = await this.prisma.courierApplication.findUniqueOrThrow({
      where: { id },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });
    return this.serialize(a);
  }

  /** Merge { courier: { transportType, isOnline:false } } into User.profile. */
  private seedCourierProfile(
    profile: Prisma.JsonValue | null,
    transportType: string | null,
  ): Prisma.InputJsonValue {
    const base =
      profile && typeof profile === 'object' && !Array.isArray(profile)
        ? (profile as Record<string, unknown>)
        : {};
    const existingCourier =
      base.courier && typeof base.courier === 'object' && !Array.isArray(base.courier)
        ? (base.courier as Record<string, unknown>)
        : {};
    return {
      ...base,
      courier: {
        ...existingCourier,
        ...(transportType ? { transportType } : {}),
        isOnline: (existingCourier.isOnline as boolean | undefined) ?? false,
      },
    } as Prisma.InputJsonValue;
  }

  private serialize(a: {
    id: string;
    status: CourierApplicationStatus;
    transportType: string | null;
    fullName: string | null;
    note: string | null;
    documentUrls: Prisma.JsonValue;
    rejectionReason: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      phone: bigint;
    } | null;
  }) {
    return {
      id: a.id,
      status: a.status,
      transportType: a.transportType,
      fullName: a.fullName,
      note: a.note,
      documentUrls: Array.isArray(a.documentUrls) ? a.documentUrls : [],
      rejectionReason: a.rejectionReason,
      reviewedAt: a.reviewedAt,
      createdAt: a.createdAt,
      user: a.user
        ? {
            id: a.user.id,
            firstName: a.user.firstName,
            lastName: a.user.lastName,
            phone: a.user.phone.toString(),
          }
        : null,
    };
  }
}
