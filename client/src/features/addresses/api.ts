import { api } from "@/shared/auth/api";
import type { Address, CreateAddressDto, UpdateAddressDto } from "./types";

export const addressesApi = {
  list: async (): Promise<Address[]> => {
    const { data } = await api.get<Address[]>("/addresses");
    return data;
  },
  create: async (dto: CreateAddressDto): Promise<Address> => {
    const { data } = await api.post<Address>("/addresses", dto);
    return data;
  },
  update: async (id: string, dto: UpdateAddressDto): Promise<Address> => {
    const { data } = await api.patch<Address>(`/addresses/${id}`, dto);
    return data;
  },
  remove: async (id: string): Promise<{ ok: true }> => {
    const { data } = await api.delete<{ ok: true }>(`/addresses/${id}`);
    return data;
  },
};
