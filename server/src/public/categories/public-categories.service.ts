import { Injectable, NotFoundException } from '@nestjs/common';
import type { Category } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { decimalToNumber } from '../../geo/geo';

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  nameRu: string | null;
  type: Category['type'];
  iconUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
  children: CategoryNode[];
}

@Injectable()
export class PublicCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active categories rendered as a nested tree. Cached at the edge later. */
  async tree(): Promise<CategoryNode[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const byParent = new Map<string | null, Category[]>();
    for (const row of rows) {
      const arr = byParent.get(row.parentId) ?? [];
      arr.push(row);
      byParent.set(row.parentId, arr);
    }

    const build = (parentId: string | null): CategoryNode[] =>
      (byParent.get(parentId) ?? []).map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        nameRu: c.nameRu,
        type: c.type,
        iconUrl: c.iconUrl,
        imageUrl: c.imageUrl,
        sortOrder: c.sortOrder,
        children: build(c.id),
      }));

    return build(null);
  }

  async getBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, slug: true, name: true } },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true, slug: true, name: true, iconUrl: true, imageUrl: true, type: true,
          },
        },
        attributes: {
          where: { attribute: { isFilterable: true } },
          include: {
            attribute: {
              include: { values: { orderBy: { sortOrder: 'asc' } } },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!category || !category.isActive) throw new NotFoundException('Kategoriya topilmadi');

    return {
      ...category,
      deliveryBaseFee: decimalToNumber(category.deliveryBaseFee),
      deliveryPerKmFee: decimalToNumber(category.deliveryPerKmFee),
      minOrderAmount: decimalToNumber(category.minOrderAmount),
    };
  }
}
