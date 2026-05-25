import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../utils/slug';
import { AttachAttributeDto } from './dto/attach-attribute.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderDto } from './dto/reorder.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  parentId: string | null;
  iconUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CategoryNode[];
}

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true, children: true, attributes: true } },
      },
    });
  }

  /** Returns the entire category tree as a nested array. Loads all rows in one query. */
  async tree(): Promise<CategoryNode[]> {
    const all = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    const byId = new Map<string, CategoryNode>();
    for (const row of all) {
      byId.set(row.id, { ...row, children: [] });
    }
    const roots: CategoryNode[] = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async get(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] },
        attributes: {
          include: { attribute: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });
    if (!cat) throw new NotFoundException('Kategoriya topilmadi');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new BadRequestException('Ota kategoriya topilmadi');
    }
    const slug = await uniqueSlug(dto.slug ?? dto.name, async (s) =>
      Boolean(await this.prisma.category.findUnique({ where: { slug: s } })),
    );
    return this.prisma.category.create({
      data: {
        name: dto.name,
        nameRu: dto.nameRu ?? null,
        slug,
        parentId: dto.parentId ?? null,
        iconUrl: dto.iconUrl ?? null,
        imageUrl: dto.imageUrl ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
        type: dto.type ?? 'MARKETPLACE',
        deliveryRadiusKm: dto.deliveryRadiusKm ?? null,
        deliveryBaseFee: dto.deliveryBaseFee ?? null,
        deliveryPerKmFee: dto.deliveryPerKmFee ?? null,
        deliveryEtaMinMinutes: dto.deliveryEtaMinMinutes ?? null,
        deliveryEtaMaxMinutes: dto.deliveryEtaMaxMinutes ?? null,
        minOrderAmount: dto.minOrderAmount ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.get(id);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Kategoriya o\'ziga ota bo\'la olmaydi');
      }
      // Prevent cycles: walk the proposed parent's ancestry; if we ever land on id, reject.
      const ok = await this.isSafeParent(id, dto.parentId);
      if (!ok) throw new BadRequestException('Tsikl yaratish mumkin emas');
    }

    let slug: string | undefined;
    if (dto.slug) {
      slug = await uniqueSlug(dto.slug, async (s) => {
        const found = await this.prisma.category.findUnique({ where: { slug: s } });
        return Boolean(found && found.id !== id);
      });
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameRu !== undefined && { nameRu: dto.nameRu || null }),
        ...(slug !== undefined && { slug }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId || null }),
        ...(dto.iconUrl !== undefined && { iconUrl: dto.iconUrl || null }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl || null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.deliveryRadiusKm !== undefined && { deliveryRadiusKm: dto.deliveryRadiusKm }),
        ...(dto.deliveryBaseFee !== undefined && { deliveryBaseFee: dto.deliveryBaseFee }),
        ...(dto.deliveryPerKmFee !== undefined && { deliveryPerKmFee: dto.deliveryPerKmFee }),
        ...(dto.deliveryEtaMinMinutes !== undefined && {
          deliveryEtaMinMinutes: dto.deliveryEtaMinMinutes,
        }),
        ...(dto.deliveryEtaMaxMinutes !== undefined && {
          deliveryEtaMaxMinutes: dto.deliveryEtaMaxMinutes,
        }),
        ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
      },
    });
  }

  async remove(id: string) {
    const cat = await this.get(id);
    if (cat.children.length > 0) {
      throw new BadRequestException('Avval ichki kategoriyalarni ko\'chiring yoki o\'chiring');
    }
    if (cat._count.products > 0) {
      throw new BadRequestException(
        `Kategoriyada ${cat._count.products} ta mahsulot bor. Avval mahsulotlarni boshqa kategoriyaga o\'tkazing.`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
  }

  async reorder(dto: ReorderDto) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );
  }

  // ─── Category × Attribute ───

  async attachAttribute(categoryId: string, dto: AttachAttributeDto) {
    await this.get(categoryId);
    const attr = await this.prisma.attribute.findUnique({ where: { id: dto.attributeId } });
    if (!attr) throw new NotFoundException('Atribut topilmadi');
    return this.prisma.categoryAttribute.upsert({
      where: {
        categoryId_attributeId: { categoryId, attributeId: dto.attributeId },
      },
      update: {
        isRequired: dto.isRequired ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
      create: {
        categoryId,
        attributeId: dto.attributeId,
        isRequired: dto.isRequired ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async detachAttribute(categoryId: string, attributeId: string) {
    const used = await this.prisma.productAttributeValue.count({
      where: { attributeId, product: { categoryId } },
    });
    if (used > 0) {
      throw new BadRequestException(
        `Bu kategoriyada ${used} ta mahsulot bu atributdan foydalanyapti. Avval ulardan tozalang.`,
      );
    }
    await this.prisma.categoryAttribute.delete({
      where: { categoryId_attributeId: { categoryId, attributeId } },
    });
  }

  private async isSafeParent(self: string, candidateParent: string): Promise<boolean> {
    let cursor: string | null = candidateParent;
    for (let i = 0; i < 32 && cursor; i++) {
      if (cursor === self) return false;
      const parent: { parentId: string | null } | null = await this.prisma.category.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = parent?.parentId ?? null;
    }
    return true;
  }
}
