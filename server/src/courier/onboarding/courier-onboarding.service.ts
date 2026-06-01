import { BadRequestException, Injectable } from '@nestjs/common';
import { CourierApplicationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { ApplyCourierDto } from './dto/apply-courier.dto';

const COURIER_ROLE_SLUG = 'courier';

/**
 * Onboarding for people who want to become couriers. Reachable by ANY
 * authenticated user (the controller carries no @Roles) because the applicant
 * does not have the `courier` role yet — it is granted by admin on approval.
 */
@Injectable()
export class CourierOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Current onboarding state: is the user already a courier + their application. */
  async getMine(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { slug: true } }, courierApplication: true },
    });
    const isCourier = user?.role?.slug === COURIER_ROLE_SLUG;
    return {
      isCourier,
      application: user?.courierApplication
        ? this.serialize(user.courierApplication)
        : null,
    };
  }

  /**
   * Submit (or re-submit) a courier application. Re-applying after a rejection
   * flips the row back to PENDING and clears the old reason.
   */
  async apply(userId: string, dto: ApplyCourierDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: { select: { slug: true } } },
    });
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi');
    if (user.role?.slug === COURIER_ROLE_SLUG) {
      throw new BadRequestException('Siz allaqachon kuryersiz');
    }

    const data = {
      transportType: dto.transportType,
      fullName: dto.fullName ?? null,
      note: dto.note ?? null,
      documentUrls: (dto.documentUrls ?? []) as unknown as Prisma.InputJsonValue,
      status: CourierApplicationStatus.PENDING,
      rejectionReason: null,
      reviewedAt: null,
      reviewedBy: null,
    };

    const application = await this.prisma.courierApplication.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });

    // Best-effort: ping admins that a new application is waiting. A missing
    // admin / push failure must never block the applicant.
    await this.notifications
      .send(
        {
          target: 'ROLE',
          roleSlug: 'admin',
          title: 'Yangi kuryer arizasi',
          body: dto.fullName
            ? `${dto.fullName} kuryer bo'lishni so'radi`
            : "Yangi foydalanuvchi kuryer bo'lishni so'radi",
          type: 'INFO',
          data: { applicationId: application.id, link: '/dashboard/moderation' },
        },
        { type: 'SYSTEM', id: null },
      )
      .catch(() => undefined);

    return this.serialize(application);
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
    updatedAt: Date;
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
      updatedAt: a.updatedAt,
    };
  }
}
