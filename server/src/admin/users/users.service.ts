import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { BlockUserDto } from './dto/block-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { SerializedUser, serializeUser } from './user.serializer';

export interface ListUsersResult {
  items: SerializedUser[];
  total: number;
  page: number;
  pageSize: number;
}

interface AuditCtx {
  actorId: string; // superAdmin id
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto): Promise<ListUsersResult> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: Prisma.UserWhereInput = {};

    if (query.roleSlug === '_none') {
      where.roleId = null;
    } else if (query.roleSlug) {
      where.role = { slug: query.roleSlug };
    }

    if (query.isBlocked === 'true') where.isBlocked = true;
    if (query.isBlocked === 'false') where.isBlocked = false;

    if (query.q && query.q.trim()) {
      const q = query.q.trim();
      const digits = q.replace(/\D/g, '');
      const or: Prisma.UserWhereInput[] = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { telegramUsername: { contains: q } },
      ];
      // Phone match: stored as BigInt; only attempt if the search term contains digits.
      if (digits.length >= 3) {
        try {
          // Exact phone match — partial substring match on BigInt isn't supported.
          or.push({ phone: BigInt(digits) });
        } catch {
          // overflow — skip phone match silently
        }
      }
      where.OR = or;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(serializeUser),
      total,
      page,
      pageSize,
    };
  }

  async get(id: string): Promise<SerializedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return serializeUser(user);
  }

  async block(id: string, dto: BlockUserDto, ctx: AuditCtx): Promise<SerializedUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.isBlocked) throw new BadRequestException('Allaqachon bloklangan');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockReason: dto.reason ?? null,
      },
      include: { role: true },
    });

    // Revoke all active sessions so the block takes effect on next request.
    await this.prisma.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.audit('user.block', ctx, id, { reason: dto.reason ?? null });
    return serializeUser(updated);
  }

  async unblock(id: string, ctx: AuditCtx): Promise<SerializedUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (!user.isBlocked) throw new BadRequestException('Bloklanmagan');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBlocked: false, blockedAt: null, blockReason: null },
      include: { role: true },
    });

    await this.audit('user.unblock', ctx, id);
    return serializeUser(updated);
  }

  async assignRole(id: string, dto: AssignRoleDto, ctx: AuditCtx): Promise<SerializedUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const nextRoleId = dto.roleId ?? null;
    if (nextRoleId) {
      const role = await this.prisma.role.findUnique({ where: { id: nextRoleId } });
      if (!role) throw new BadRequestException('Tanlangan rol topilmadi');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId: nextRoleId },
      include: { role: true },
    });

    await this.audit('user.role.assign', ctx, id, {
      previousRoleId: user.roleId,
      roleId: nextRoleId,
    });
    return serializeUser(updated);
  }

  private async audit(
    action: string,
    ctx: AuditCtx,
    resourceId: string,
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorType: 'SUPER_ADMIN',
        actorId: ctx.actorId,
        action,
        resource: 'user',
        resourceId,
        ...(metadata !== undefined && { metadata }),
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  }
}
