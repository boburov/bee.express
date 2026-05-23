import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../utils/slug';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandService {
  constructor(private readonly prisma: PrismaService) {}

  list(params: { q?: string; isActive?: boolean }) {
    const where: Prisma.BrandWhereInput = {};
    if (params.q) where.name = { contains: params.q };
    if (typeof params.isActive === 'boolean') where.isActive = params.isActive;
    return this.prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brend topilmadi');
    return brand;
  }

  async create(dto: CreateBrandDto) {
    const slug = await uniqueSlug(dto.slug ?? dto.name, async (s) =>
      Boolean(await this.prisma.brand.findUnique({ where: { slug: s } })),
    );
    return this.prisma.brand.create({
      data: {
        name: dto.name,
        slug,
        logoUrl: dto.logoUrl ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateBrandDto) {
    await this.get(id);
    let slug: string | undefined;
    if (dto.slug) {
      slug = await uniqueSlug(dto.slug, async (s) => {
        const found = await this.prisma.brand.findUnique({ where: { slug: s } });
        return Boolean(found && found.id !== id);
      });
    }
    return this.prisma.brand.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(slug !== undefined && { slug }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const used = await this.prisma.product.count({ where: { brandId: id } });
    if (used > 0) {
      throw new BadRequestException(
        `Brend ${used} ta mahsulotda ishlatilgan. Avval mahsulotlardan ajrating.`,
      );
    }
    await this.get(id);
    await this.prisma.brand.delete({ where: { id } });
  }
}
