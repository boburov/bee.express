import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { uniqueSlug } from '../../catalog/utils/slug';
import { UploadsService } from '../../uploads/uploads.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { SerializedStore, serializeStore } from './store.serializer';

@Injectable()
export class StoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /** GET /seller/stores/me — null if the seller hasn't created a store yet. */
  async getMine(sellerId: string): Promise<SerializedStore | null> {
    const store = await this.prisma.store.findFirst({
      where: { ownerId: sellerId },
      orderBy: { createdAt: 'desc' },
    });
    return store ? serializeStore(store) : null;
  }

  /** Sellers can have ONE store in v1. Multi-branch is a v2 concern. */
  async create(dto: CreateStoreDto, sellerId: string): Promise<SerializedStore> {
    const existing = await this.prisma.store.findFirst({ where: { ownerId: sellerId } });
    if (existing) {
      throw new ConflictException("Sizda allaqachon do'kon mavjud. Yangi do'kon yaratish o'rniga uni tahrirlang.");
    }

    this.assertGeoPaired(dto.latitude, dto.longitude);

    const slug = await uniqueSlug(dto.slug ?? dto.name, async (s) =>
      Boolean(await this.prisma.store.findUnique({ where: { slug: s } })),
    );

    const data: Prisma.StoreCreateInput = {
      slug,
      name: dto.name,
      description: dto.description ?? null,
      inn: dto.inn ?? null,
      legalName: dto.legalName ?? null,
      phone: dto.phone ?? null,
      address: dto.address ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      deliveryRadiusKm: dto.deliveryRadiusKm ?? null,
      deliveryBaseFee: dto.deliveryBaseFee ?? null,
      deliveryPerKmFee: dto.deliveryPerKmFee ?? null,
      deliveryEtaMinutes: dto.deliveryEtaMinutes ?? null,
      minOrderAmount: dto.minOrderAmount ?? null,
      isOpen: dto.isOpen ?? true,
      openingHours: (dto.openingHours ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      owner: { connect: { id: sellerId } },
    };

    if (dto.logoUploadId) {
      const upload = await this.uploads.getReadyOrThrow(dto.logoUploadId, sellerId);
      data.logoUrl = upload.url;
    }
    if (dto.bannerUploadId) {
      const upload = await this.uploads.getReadyOrThrow(dto.bannerUploadId, sellerId);
      data.bannerUrl = upload.url;
    }

    const store = await this.prisma.store.create({ data });

    if (dto.logoUploadId) await this.uploads.attach(dto.logoUploadId, 'store', store.id);
    if (dto.bannerUploadId) await this.uploads.attach(dto.bannerUploadId, 'store', store.id);

    return serializeStore(store);
  }

  async updateMine(dto: UpdateStoreDto, sellerId: string): Promise<SerializedStore> {
    const store = await this.prisma.store.findFirst({ where: { ownerId: sellerId } });
    if (!store) throw new NotFoundException("Avval do'kon yarating");

    if (dto.latitude !== undefined || dto.longitude !== undefined) {
      const lat = dto.latitude ?? store.latitude;
      const lng = dto.longitude ?? store.longitude;
      this.assertGeoPaired(
        lat === null ? undefined : Number(lat),
        lng === null ? undefined : Number(lng),
      );
    }

    const data: Prisma.StoreUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description || null }),
      ...(dto.inn !== undefined && { inn: dto.inn || null }),
      ...(dto.legalName !== undefined && { legalName: dto.legalName || null }),
      ...(dto.phone !== undefined && { phone: dto.phone || null }),
      ...(dto.address !== undefined && { address: dto.address || null }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.deliveryRadiusKm !== undefined && { deliveryRadiusKm: dto.deliveryRadiusKm }),
      ...(dto.deliveryBaseFee !== undefined && { deliveryBaseFee: dto.deliveryBaseFee }),
      ...(dto.deliveryPerKmFee !== undefined && { deliveryPerKmFee: dto.deliveryPerKmFee }),
      ...(dto.deliveryEtaMinutes !== undefined && { deliveryEtaMinutes: dto.deliveryEtaMinutes }),
      ...(dto.minOrderAmount !== undefined && { minOrderAmount: dto.minOrderAmount }),
      ...(dto.isOpen !== undefined && { isOpen: dto.isOpen }),
      ...(dto.openingHours !== undefined && {
        openingHours: (dto.openingHours ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      }),
    };

    if (dto.logoUploadId) {
      const upload = await this.uploads.getReadyOrThrow(dto.logoUploadId, sellerId);
      data.logoUrl = upload.url;
    }
    if (dto.bannerUploadId) {
      const upload = await this.uploads.getReadyOrThrow(dto.bannerUploadId, sellerId);
      data.bannerUrl = upload.url;
    }

    const updated = await this.prisma.store.update({ where: { id: store.id }, data });

    if (dto.logoUploadId) await this.uploads.attach(dto.logoUploadId, 'store', store.id);
    if (dto.bannerUploadId) await this.uploads.attach(dto.bannerUploadId, 'store', store.id);

    return serializeStore(updated);
  }

  async toggleOpen(isOpen: boolean, sellerId: string): Promise<SerializedStore> {
    const store = await this.prisma.store.findFirst({ where: { ownerId: sellerId } });
    if (!store) throw new NotFoundException("Avval do'kon yarating");
    if (store.status !== 'ACTIVE') {
      throw new BadRequestException(
        "Do'kon hali tasdiqlanmagan — Open/Close faqat ACTIVE holatda ishlaydi.",
      );
    }
    const updated = await this.prisma.store.update({
      where: { id: store.id },
      data: { isOpen },
    });
    return serializeStore(updated);
  }

  private assertGeoPaired(lat: number | undefined, lng: number | undefined): void {
    const hasLat = lat !== undefined && lat !== null;
    const hasLng = lng !== undefined && lng !== null;
    if (hasLat !== hasLng) {
      throw new BadRequestException(
        'latitude va longitude birga berilishi kerak (yoki ikkalasi ham bo\'sh).',
      );
    }
  }
}

