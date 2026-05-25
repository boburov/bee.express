import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../../catalog/utils/slug';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

export interface SerializedRole {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AuditCtx {
  actorId: string;
  ip?: string;
  userAgent?: string;
}

function permissionsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string');
  return [];
}

function serialize(role: Role, userCount = 0): SerializedRole {
  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: permissionsFrom(role.permissions),
    userCount,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<SerializedRole[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    const counts = await this.prisma.user.groupBy({
      by: ['roleId'],
      _count: { _all: true },
    });
    const countMap = new Map<string, number>();
    for (const c of counts) {
      if (c.roleId) countMap.set(c.roleId, c._count._all);
    }
    return roles.map((r) => serialize(r, countMap.get(r.id) ?? 0));
  }

  async get(id: string): Promise<SerializedRole> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol topilmadi');
    const userCount = await this.prisma.user.count({ where: { roleId: id } });
    return serialize(role, userCount);
  }

  async create(dto: CreateRoleDto, ctx: AuditCtx): Promise<SerializedRole> {
    const slug = await uniqueSlug(dto.slug ?? dto.name, async (s) =>
      Boolean(await this.prisma.role.findUnique({ where: { slug: s } })),
    );

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
        isSystem: false,
        permissions: dto.permissions ?? [],
      },
    });

    await this.audit('role.create', ctx, role.id, { slug: role.slug, name: role.name });
    return serialize(role, 0);
  }

  async update(id: string, dto: UpdateRoleDto, ctx: AuditCtx): Promise<SerializedRole> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol topilmadi');

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.permissions !== undefined && { permissions: dto.permissions }),
      },
    });

    await this.audit('role.update', ctx, id, { changes: dto as unknown as Prisma.InputJsonObject });
    const userCount = await this.prisma.user.count({ where: { roleId: id } });
    return serialize(updated, userCount);
  }

  async remove(id: string, ctx: AuditCtx): Promise<void> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Rol topilmadi');
    if (role.isSystem) throw new BadRequestException('Tizim rolini o\'chirib bo\'lmaydi');

    const used = await this.prisma.user.count({ where: { roleId: id } });
    if (used > 0) {
      throw new BadRequestException(
        `Bu rol ${used} ta foydalanuvchida ishlatilgan. Avval ularning rolini o'zgartiring.`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    await this.audit('role.delete', ctx, id, { slug: role.slug });
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
        resource: 'role',
        resourceId,
        ...(metadata !== undefined && { metadata }),
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
    });
  }
}
