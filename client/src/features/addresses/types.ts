export interface Address {
  id: string;
  label: string;
  fullText: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressDto {
  label: string;
  fullText: string;
  latitude: number;
  longitude: number;
  notes?: string;
  isDefault?: boolean;
}

export type UpdateAddressDto = Partial<CreateAddressDto>;
