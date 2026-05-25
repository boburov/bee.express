import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListAuditQueryDto } from './dto/list-audit-query.dto';

export interface SerializedAuditEntry {
  id: string;
  actorType: 'USER' | 'SUPER_ADMIN' | 'SYSTEM';
  actorId: string | null;
  actor: { type: 'user' | 'super_admin'; label: string } | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  metadata: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListAuditQueryDto): Promise<{
    items: SerializedAuditEntry[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 30;

    const where: Prisma.AuditLogWhereInput = {};
    if (query.action) where.action = { contains: query.action };
    if (query.resource) where.resource = query.resource;
    if (query.actorId) where.actorId = query.actorId;
    if (query.actorType) where.actorType = query.actorType;
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Resolve actor labels in one shot per actor type.
    const userIds = rows
      .filter((r) => r.actorType === 'USER' && r.actorId)
      .map((r) => r.actorId!) as string[];
    const superAdminIds = rows
      .filter((r) => r.actorType === 'SUPER_ADMIN' && r.actorId)
      .map((r) => r.actorId!) as string[];

    const [users, superAdmins] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, firstName: true, lastName: true, phone: true, telegramUsername: true },
          })
        : Promise.resolve([]),
      superAdminIds.length
        ? this.prisma.superAdmin.findMany({
            where: { id: { in: superAdminIds } },
            select: { id: true, username: true, fullName: true },
          })
        : Promise.resolve([]),
    ]);

    const userMap = new Map(
      users.map((u) => [
        u.id,
        u.firstName || u.lastName
          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
          : u.telegramUsername
            ? `@${u.telegramUsername}`
            : u.phone < 0n
              ? 'TG kirgan foydalanuvchi'
              : `+${u.phone.toString()}`,
      ]),
    );
    const superAdminMap = new Map(
      superAdmins.map((s) => [s.id, s.fullName ?? s.username]),
    );

    return {
      items: rows.map((r): SerializedAuditEntry => {
        let actor: SerializedAuditEntry['actor'] = null;
        if (r.actorId) {
          if (r.actorType === 'USER') {
            actor = { type: 'user', label: userMap.get(r.actorId) ?? r.actorId };
          } else if (r.actorType === 'SUPER_ADMIN') {
            actor = { type: 'super_admin', label: superAdminMap.get(r.actorId) ?? r.actorId };
          }
        }
        return {
          id: r.id,
          actorType: r.actorType,
          actorId: r.actorId,
          actor,
          action: r.action,
          resource: r.resource,
          resourceId: r.resourceId,
          metadata: r.metadata,
          ip: r.ip,
          userAgent: r.userAgent,
          createdAt: r.createdAt.toISOString(),
        };
      }),
      total,
      page,
      pageSize,
    };
  }
}
