import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AttributeType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../utils/slug';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import {
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
} from './dto/attribute-value.dto';
import { UpdateAttributeDto } from './dto/update-attribute.dto';

const VALUE_TYPES: AttributeType[] = [AttributeType.SELECT, AttributeType.MULTI];

@Injectable()
export class AttributeService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.attribute.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { values: true, categories: true } } },
    });
  }

  async get(id: string) {
    const attr = await this.prisma.attribute.findUnique({
      where: { id },
      include: {
        values: { orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }] },
        categories: { include: { category: true } },
      },
    });
    if (!attr) throw new NotFoundException('Atribut topilmadi');
    return attr;
  }

  async create(dto: CreateAttributeDto) {
    const slug = await uniqueSlug(dto.slug ?? dto.name, async (s) =>
      Boolean(await this.prisma.attribute.findUnique({ where: { slug: s } })),
    );
    return this.prisma.attribute.create({
      data: {
        name: dto.name,
        nameRu: dto.nameRu ?? null,
        slug,
        type: dto.type,
        unit: dto.unit ?? null,
        isFilterable: dto.isFilterable ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateAttributeDto) {
    const existing = await this.get(id);

    if (dto.type && dto.type !== existing.type) {
      // Switching between SELECT/MULTI is fine if values exist; switching to NUMBER/TEXT/BOOL
      // would orphan existing AttributeValue rows. Forbid for safety.
      const valueCount = existing.values.length;
      const wasValueType = VALUE_TYPES.includes(existing.type);
      const isValueType = VALUE_TYPES.includes(dto.type);
      if (valueCount > 0 && wasValueType && !isValueType) {
        throw new BadRequestException(
          `Bu atributda ${valueCount} ta qiymat bor. Avval qiymatlarni o\'chiring, keyin turini o\'zgartiring.`,
        );
      }
    }

    let slug: string | undefined;
    if (dto.slug) {
      slug = await uniqueSlug(dto.slug, async (s) => {
        const found = await this.prisma.attribute.findUnique({ where: { slug: s } });
        return Boolean(found && found.id !== id);
      });
    }

    return this.prisma.attribute.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.nameRu !== undefined && { nameRu: dto.nameRu || null }),
        ...(slug !== undefined && { slug }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.unit !== undefined && { unit: dto.unit || null }),
        ...(dto.isFilterable !== undefined && { isFilterable: dto.isFilterable }),
      },
    });
  }

  async remove(id: string) {
    const attr = await this.get(id);
    const usedInProducts = await this.prisma.productAttributeValue.count({
      where: { attributeId: id },
    });
    if (usedInProducts > 0) {
      throw new BadRequestException(
        `Atribut ${usedInProducts} ta mahsulotda ishlatilgan. Avval ulardan ajrating.`,
      );
    }
    if (attr.categories.length > 0) {
      throw new BadRequestException(
        `Atribut ${attr.categories.length} ta kategoriyaga biriktirilgan. Avval ajrating.`,
      );
    }
    await this.prisma.attribute.delete({ where: { id } });
  }

  // ─── Values (SELECT/MULTI only) ───

  async listValues(attributeId: string) {
    await this.get(attributeId);
    return this.prisma.attributeValue.findMany({
      where: { attributeId },
      orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
    });
  }

  async addValue(attributeId: string, dto: CreateAttributeValueDto) {
    const attr = await this.get(attributeId);
    if (!VALUE_TYPES.includes(attr.type)) {
      throw new BadRequestException(
        `Qiymatlar faqat SELECT yoki MULTI atributlarga qo\'shiladi. Bu — ${attr.type}.`,
      );
    }
    const dup = await this.prisma.attributeValue.findUnique({
      where: { attributeId_value: { attributeId, value: dto.value } },
    });
    if (dup) throw new BadRequestException('Bu qiymat allaqachon mavjud');
    return this.prisma.attributeValue.create({
      data: {
        attributeId,
        value: dto.value,
        label: dto.label ?? null,
        hexColor: dto.hexColor ?? null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateValue(attributeId: string, valueId: string, dto: UpdateAttributeValueDto) {
    const v = await this.prisma.attributeValue.findFirst({
      where: { id: valueId, attributeId },
    });
    if (!v) throw new NotFoundException('Qiymat topilmadi');

    if (dto.value && dto.value !== v.value) {
      const dup = await this.prisma.attributeValue.findUnique({
        where: { attributeId_value: { attributeId, value: dto.value } },
      });
      if (dup) throw new BadRequestException('Bu qiymat allaqachon mavjud');
    }

    return this.prisma.attributeValue.update({
      where: { id: valueId },
      data: {
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.label !== undefined && { label: dto.label || null }),
        ...(dto.hexColor !== undefined && { hexColor: dto.hexColor || null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async removeValue(attributeId: string, valueId: string) {
    const v = await this.prisma.attributeValue.findFirst({
      where: { id: valueId, attributeId },
    });
    if (!v) throw new NotFoundException('Qiymat topilmadi');
    const used =
      (await this.prisma.productAttributeValue.count({ where: { valueId } })) +
      (await this.prisma.variantOption.count({ where: { valueId } }));
    if (used > 0) {
      throw new BadRequestException(
        `Qiymat ${used} marta ishlatilgan. Avval mahsulot/variantlardan ajrating.`,
      );
    }
    await this.prisma.attributeValue.delete({ where: { id: valueId } });
  }
}
