import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma, type Notification, type NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramQueueService } from '../queue/telegram-queue.service';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationsGateway } from './notifications.gateway';
import type { NotificationPushPayload } from './types';

interface SenderContext {
  type: 'SUPER_ADMIN' | 'USER' | 'SYSTEM';
  id: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly telegramQueue: TelegramQueueService,
  ) {}

  /**
   * Fan a single logical notification to one user, all users with a given
   * role, or every active user. Returns the freshly-created rows.
   *
   * `groupId` is shared by every row so the admin history can group "Sent
   * to 230 sellers" as one entry. We don't denormalize the dispatch metadata
   * — querying by groupId is cheap with the existing `@@index([groupId])`.
   *
   * For BROADCAST/ROLE targets the actual recipients are resolved here in
   * a single SQL call (`SELECT id FROM User WHERE …`). Up to ~50k rows we
   * use createMany — beyond that, replace with a Bull job.
   */
  async send(dto: SendNotificationDto, sender: SenderContext): Promise<{
    groupId: string;
    recipients: number;
    skipped: number;
  }> {
    const groupId = randomBytes(8).toString('hex');

    const recipientIds = await this.resolveRecipients(dto);
    if (recipientIds.length === 0) {
      throw new BadRequestException('Hech qanday qabul qiluvchi topilmadi.');
    }

    // Persist all rows.
    await this.prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        recipientId,
        senderType: sender.type,
        senderId: sender.id,
        title: dto.title,
        body: dto.body ?? null,
        type: dto.type ?? 'INFO',
        data: (dto.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        groupId,
      })),
    });

    // Re-read with cuids so the WS payload carries real IDs.
    const persisted = await this.prisma.notification.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
    });

    // Push via socket + update unread counts. Best-effort: a failed push is
    // not an error — the client will pick the row up on next /mine fetch.
    const unreadByUser = new Map<string, number>();
    for (const row of persisted) {
      const payload = this.toPushPayload(row);
      const delivered = this.gateway.pushToUser(row.recipientId, payload);
      if (delivered) {
        await this.prisma.notification
          .update({ where: { id: row.id }, data: { delivered: true } })
          .catch(() => undefined);
      }
      unreadByUser.set(
        row.recipientId,
        (unreadByUser.get(row.recipientId) ?? 0) + 1,
      );
    }

    // Emit fresh unread count to each toucher.
    await Promise.all(
      Array.from(unreadByUser.keys()).map(async (userId) => {
        const count = await this.prisma.notification.count({
          where: { recipientId: userId, readAt: null },
        });
        this.gateway.emitUnreadCount(userId, count);
      }),
    );

    // Best-effort Telegram mirror for every notification (order events AND
    // admin broadcasts) to recipients with a linked Telegram account. The
    // in-app row above is the source of truth, so a dropped copy is harmless.
    await this.pushTelegram(recipientIds, dto).catch((e) =>
      this.logger.warn(`telegram enqueue failed: ${String(e)}`),
    );

    return {
      groupId,
      recipients: persisted.length,
      skipped: 0,
    };
  }

  /** Enqueue a Telegram copy for recipients who have a linked Telegram account. */
  private async pushTelegram(
    recipientIds: string[],
    dto: SendNotificationDto,
  ): Promise<void> {
    if (recipientIds.length === 0) return;
    const link = (dto.data as { link?: string } | undefined)?.link;

    const users = await this.prisma.user.findMany({
      where: { id: { in: recipientIds }, telegramId: { not: null } },
      select: { telegramId: true },
    });
    if (users.length === 0) return;

    const text = dto.body ? `${dto.title}\n${dto.body}` : dto.title;
    await Promise.all(
      users.map((u) =>
        u.telegramId
          ? this.telegramQueue
              .publish({ telegramId: u.telegramId, text, link })
              .catch(() => undefined)
          : undefined,
      ),
    );
  }

  async listMine(userId: string, query: ListNotificationsQueryDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where = {
      recipientId: userId,
      ...(query.unreadOnly === 'true' && { readAt: null }),
    };

    const [items, total, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { recipientId: userId, readAt: null },
      }),
    ]);

    return { items, total, unread, page, pageSize };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, readAt: null },
    });
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    if (!row || row.recipientId !== userId) {
      throw new NotFoundException('Bildirishnoma topilmadi');
    }
    if (row.readAt) return row;
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    const count = await this.unreadCount(userId);
    this.gateway.emitUnreadCount(userId, count);
    return updated;
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const res = await this.prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
    this.gateway.emitUnreadCount(userId, 0);
    return { updated: res.count };
  }

  /** Admin-side history — every group the admin has sent. */
  async listGroups(opts: { page?: number; pageSize?: number }) {
    const page = opts.page ?? 1;
    const pageSize = opts.pageSize ?? 20;

    // Aggregate per groupId: latest row carries title/body/type, count =
    // recipients, deliveredCount + readCount for ops dashboards.
    const groups = await this.prisma.$queryRaw<
      Array<{
        groupId: string;
        title: string;
        body: string | null;
        type: NotificationType;
        senderType: string;
        senderId: string | null;
        recipients: bigint;
        deliveredCount: bigint;
        readCount: bigint;
        createdAt: Date;
      }>
    >`
      SELECT
        groupId,
        ANY_VALUE(title)       AS title,
        ANY_VALUE(body)        AS body,
        ANY_VALUE(type)        AS type,
        ANY_VALUE(senderType)  AS senderType,
        ANY_VALUE(senderId)    AS senderId,
        COUNT(*)               AS recipients,
        SUM(delivered)         AS deliveredCount,
        SUM(readAt IS NOT NULL) AS readCount,
        MIN(createdAt)         AS createdAt
      FROM Notification
      WHERE groupId IS NOT NULL
      GROUP BY groupId
      ORDER BY createdAt DESC
      LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
    `;

    return {
      items: groups.map((g) => ({
        groupId: g.groupId,
        title: g.title,
        body: g.body,
        type: g.type,
        senderType: g.senderType,
        senderId: g.senderId,
        recipients: Number(g.recipients),
        deliveredCount: Number(g.deliveredCount),
        readCount: Number(g.readCount),
        createdAt: g.createdAt.toISOString(),
      })),
      page,
      pageSize,
    };
  }

  // ─── Helpers ───

  private async resolveRecipients(dto: SendNotificationDto): Promise<string[]> {
    switch (dto.target) {
      case 'USER': {
        if (!dto.userIds || dto.userIds.length === 0) {
          throw new BadRequestException('userIds bo\'sh.');
        }
        const found = await this.prisma.user.findMany({
          where: { id: { in: dto.userIds }, isBlocked: false },
          select: { id: true },
        });
        return found.map((u) => u.id);
      }
      case 'ROLE': {
        if (!dto.roleSlug) throw new BadRequestException('roleSlug bo\'sh.');
        const role = await this.prisma.role.findUnique({
          where: { slug: dto.roleSlug },
          select: { id: true },
        });
        if (!role) throw new BadRequestException(`Rol topilmadi: ${dto.roleSlug}`);
        const users = await this.prisma.user.findMany({
          where: { roleId: role.id, isBlocked: false },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }
      case 'BROADCAST': {
        const users = await this.prisma.user.findMany({
          where: { isBlocked: false },
          select: { id: true },
        });
        return users.map((u) => u.id);
      }
    }
  }

  private toPushPayload(row: Notification): NotificationPushPayload {
    return {
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.type,
      data: row.data,
      groupId: row.groupId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
