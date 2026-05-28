import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Address } from '@prisma/client';
import { decimalToNumber } from '../geo/geo';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

export interface SerializedAddress {
  id: string;
  label: string;
  fullText: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeAddress(a: Address): SerializedAddress {
  return {
    id: a.id,
    label: a.label,
    fullText: a.fullText,
    latitude: decimalToNumber(a.latitude)!,
    longitude: decimalToNumber(a.longitude)!,
    notes: a.notes ?? null,
    isDefault: a.isDefault,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<SerializedAddress[]> {
    const items = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return items.map(serializeAddress);
  }

  async create(dto: CreateAddressDto, userId: string): Promise<SerializedAddress> {
    return this.prisma.$transaction(async (tx) => {
      // Auto-promote the very first address to default. If the user explicitly
      // asked for isDefault, demote any current default first.
      const existingCount = await tx.address.count({ where: { userId } });
      const wantDefault = dto.isDefault === true || existingCount === 0;

      if (wantDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await tx.address.create({
        data: {
          userId,
          label: dto.label,
          fullText: dto.fullText,
          latitude: dto.latitude,
          longitude: dto.longitude,
          notes: dto.notes ?? null,
          isDefault: wantDefault,
        },
      });
      return serializeAddress(created);
    });
  }

  async update(id: string, dto: UpdateAddressDto, userId: string): Promise<SerializedAddress> {
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Manzil topilmadi');
    if (existing.userId !== userId) throw new ForbiddenException();

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault === true && !existing.isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      const updated = await tx.address.update({
        where: { id },
        data: {
          ...(dto.label !== undefined && { label: dto.label }),
          ...(dto.fullText !== undefined && { fullText: dto.fullText }),
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
          ...(dto.notes !== undefined && { notes: dto.notes || null }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      });
      return serializeAddress(updated);
    });
  }

  async remove(id: string, userId: string): Promise<{ ok: true }> {
    const existing = await this.prisma.address.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Manzil topilmadi');
    if (existing.userId !== userId) throw new ForbiddenException();

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id } });
      // If we just removed the default, promote the newest remaining one.
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });
        if (next) {
          await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
        }
      }
    });

    return { ok: true };
  }

  /** Used by orders/checkout to verify+load an address belongs to the buyer. */
  async getOwnedOrThrow(id: string, userId: string): Promise<Address> {
    const a = await this.prisma.address.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Manzil topilmadi');
    if (a.userId !== userId) throw new ForbiddenException();
    return a;
  }
}
