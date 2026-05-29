import { api } from "@/shared/auth/api";
import type { CreateStoreDto, Store, UpdateStoreDto } from "./types";

export const storeApi = {
  /** GET /seller/stores/me — null if no store created yet. */
  getMine: async (): Promise<Store | null> => {
    const { data } = await api.get<Store | null>("/seller/stores/me");
    return data;
  },
  create: async (dto: CreateStoreDto): Promise<Store> => {
    const { data } = await api.post<Store>("/seller/stores", dto);
    return data;
  },
  updateMine: async (dto: UpdateStoreDto): Promise<Store> => {
    const { data } = await api.patch<Store>("/seller/stores/me", dto);
    return data;
  },
  toggleOpen: async (isOpen: boolean): Promise<Store> => {
    const { data } = await api.patch<Store>("/seller/stores/me/open", { isOpen });
    return data;
  },
};
