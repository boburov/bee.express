import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../../catalog/utils/slug';
import { UploadsService } from '../../uploads/uploads.service';
import { SellerContext } from '../seller-context';
import { CreateProductDto, CreateProductAttributeDto } from './dto/create-product.dto';
import { ListSellerProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Seller-scoped product CRUD. Sellers create **master products** that are
 * auto-published (status: ACTIVE) so they appear in the client catalog
 * immediately — no admin moderation gate. The seller's `SellerOffer`
 * (price/stock) makes the product purchasable. Admin can still suspend or
 * archive a product later via the moderation endpoints.
 *
 * v1 simplification: one default ProductVariant per product. Variant
 * combinations (color/size/RAM) are added by editing the product later.
 */
@Injectable()
export class SellerProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
    private readonly ctx: SellerContext,
  ) {}

  async list(query: ListSellerProductsQueryDto, sellerId: string) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;

    const where: Prisma.ProductWhereInput = { createdById: sellerId };
    if (query.q) where.title = { contains: query.q };
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, slug: true, name: true, type: true } },
          brand: { select: { id: true, slug: true, name: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: {
            where: { isDefault: true },
            include: {
              offers: { where: { store: { ownerId: sellerId } } },
            },
            take: 1,
          },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string, sellerId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
        attributeValues: { include: { attribute: true, value: true } },
        variants: { include: { offers: true, options: { include: { value: true } } } },
      },
    });
    if (!product) throw new NotFoundException('Mahsulot topilmadi');
    if (product.createdById !== sellerId) {
      throw new ForbiddenException("Bu mahsulot sizniki emas");
    }
    return product;
  }

  async create(dto: CreateProductDto, sellerId: string) {
    // Seller must have an APPROVED store (PENDING stores can't list products).
    const store = await this.ctx.requireOwnStore(sellerId);

    // Validate category exists + collect required attributes for the message.
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      include: { attributes: { where: { isRequired: true } } },
    });
    if (!category) throw new BadRequestException('Tanlangan kategoriya topilmadi');

    // Brand existence (optional).
    if (dto.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand) throw new BadRequestException('Tanlangan brend topilmadi');
    }

    // Validate attribute payload coverage.
    await this.validateAttributes(dto.categoryId, dto.attributes ?? []);

    const slug = await uniqueSlug(dto.slug ?? dto.title, async (s) =>
      Boolean(await this.prisma.product.findUnique({ where: { slug: s } })),
    );

    // Resolve upload IDs → urls before opening the transaction.
    const images = await this.resolveImages(dto.imageUploadIds ?? [], sellerId);
    if ((dto.imageUploadIds?.length ?? 0) === 0) {
      throw new BadRequestException(
        'Kamida bitta rasm kerak — avval /uploads orqali yuklang.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug,
          title: dto.title,
          titleRu: dto.titleRu ?? null,
          description: dto.description ?? null,
          categoryId: dto.categoryId,
          brandId: dto.brandId ?? null,
          createdById: sellerId,
          // Auto-published: visible in the client catalog right away.
          status: 'ACTIVE',
          publishedAt: new Date(),
          images: {
            create: images.map((img, sortOrder) => ({
              url: img.url,
              sortOrder,
            })),
          },
        },
      });

      // Attribute values
      if (dto.attributes && dto.attributes.length > 0) {
        await tx.productAttributeValue.createMany({
          data: dto.attributes.map((a) => ({
            productId: product.id,
            attributeId: a.attributeId,
            valueId: a.valueId ?? null,
            rawValue: a.rawValue ?? null,
          })),
        });
      }

      // Default variant
      const variant = await tx.productVariant.create({
        data: { productId: product.id, isDefault: true, title: 'Default' },
      });

      // Initial offer (optional — created if price provided)
      if (dto.price !== undefined) {
        await tx.sellerOffer.create({
          data: {
            storeId: store.id,
            variantId: variant.id,
            price: dto.price,
            oldPrice: dto.oldPrice ?? null,
            stock: dto.stock ?? 0,
            isActive: (dto.stock ?? 0) > 0,
          },
        });
      }

      return product;
    });

    // Attach upload metadata (best-effort, outside the tx).
    for (const img of images) {
      await this.uploads.attach(img.uploadId, 'product', result.id);
    }

    return this.get(result.id, sellerId);
  }

  async update(id: string, dto: UpdateProductDto, sellerId: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Mahsulot topilmadi');
    if (existing.createdById !== sellerId) {
      throw new ForbiddenException('Bu mahsulot sizniki emas');
    }
    if (existing.status === 'ARCHIVED') {
      throw new BadRequestException('Arxivlangan mahsulotni tahrirlab bo\'lmaydi');
    }

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!cat) throw new BadRequestException('Tanlangan kategoriya topilmadi');
    }
    if (dto.brandId !== undefined && dto.brandId !== null && dto.brandId !== existing.brandId) {
      const brand = await this.prisma.brand.findUnique({ where: { id: dto.brandId } });
      if (!brand) throw new BadRequestException('Tanlangan brend topilmadi');
    }

    if (dto.attributes) {
      await this.validateAttributes(dto.categoryId ?? existing.categoryId, dto.attributes);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.titleRu !== undefined && { titleRu: dto.titleRu || null }),
          ...(dto.description !== undefined && { description: dto.description || null }),
          ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
          ...(dto.brandId !== undefined && { brandId: dto.brandId || null }),
          // Auto-published: edits stay live (no re-moderation gate). Keep the
          // original publish timestamp; backfill it for legacy PENDING rows.
          status: 'ACTIVE',
          publishedAt: existing.publishedAt ?? new Date(),
        },
      });

      if (dto.attributes) {
        await tx.productAttributeValue.deleteMany({ where: { productId: id } });
        if (dto.attributes.length > 0) {
          await tx.productAttributeValue.createMany({
            data: dto.attributes.map((a) => ({
              productId: id,
              attributeId: a.attributeId,
              valueId: a.valueId ?? null,
              rawValue: a.rawValue ?? null,
            })),
          });
        }
      }
    });

    // Append new images (does NOT clear existing — for that, future endpoint).
    if (dto.imageUploadIds && dto.imageUploadIds.length > 0) {
      const images = await this.resolveImages(dto.imageUploadIds, sellerId);
      const existingCount = await this.prisma.productImage.count({ where: { productId: id } });
      await this.prisma.productImage.createMany({
        data: images.map((img, i) => ({
          productId: id,
          url: img.url,
          sortOrder: existingCount + i,
        })),
      });
      for (const img of images) await this.uploads.attach(img.uploadId, 'product', id);
    }

    return this.get(id, sellerId);
  }

  async remove(id: string, sellerId: string): Promise<void> {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Mahsulot topilmadi');
    if (existing.createdById !== sellerId) {
      throw new ForbiddenException('Bu mahsulot sizniki emas');
    }
    // Soft-delete via ARCHIVED — hard-deleting a product breaks order history
    // once orders ship.
    await this.prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
  }

  private async resolveImages(
    uploadIds: string[],
    sellerId: string,
  ): Promise<{ uploadId: string; url: string }[]> {
    const results: { uploadId: string; url: string }[] = [];
    for (const uploadId of uploadIds) {
      const upload = await this.uploads.getReadyOrThrow(uploadId, sellerId);
      if (upload.purpose !== 'PRODUCT_IMAGE') {
        throw new BadRequestException(
          `Upload ${uploadId} mahsulot rasmi sifatida emas. PRODUCT_IMAGE purpose bilan qaytadan yuklang.`,
        );
      }
      results.push({ uploadId, url: upload.url! });
    }
    return results;
  }

  /**
   * Ensures every REQUIRED CategoryAttribute is present in the payload, and
   * that valueId / rawValue match the attribute type. We trust the DTO shape
   * but verify referential integrity here.
   */
  private async validateAttributes(
    categoryId: string,
    payload: CreateProductAttributeDto[],
  ): Promise<void> {
    const links = await this.prisma.categoryAttribute.findMany({
      where: { categoryId },
      include: { attribute: true },
    });
    const requiredIds = new Set(links.filter((l) => l.isRequired).map((l) => l.attributeId));
    const provided = new Set(payload.map((a) => a.attributeId));

    for (const reqId of requiredIds) {
      if (!provided.has(reqId)) {
        const name = links.find((l) => l.attributeId === reqId)?.attribute.name;
        throw new BadRequestException(`Majburiy atribut bo'sh: ${name ?? reqId}`);
      }
    }

    for (const item of payload) {
      const link = links.find((l) => l.attributeId === item.attributeId);
      if (!link) {
        throw new BadRequestException(
          `Atribut ${item.attributeId} ushbu kategoriyaga biriktirilmagan.`,
        );
      }
      const t = link.attribute.type;
      if (t === 'SELECT' || t === 'MULTI') {
        if (!item.valueId) {
          throw new BadRequestException(
            `${link.attribute.name} uchun valueId kerak (SELECT/MULTI atribut).`,
          );
        }
      } else if (!item.rawValue) {
        throw new BadRequestException(
          `${link.attribute.name} uchun rawValue kerak (${t} atribut).`,
        );
      }
    }
  }
}
