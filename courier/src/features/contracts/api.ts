import { api } from "@/lib/api";
import type {
  ContractStatus,
  CourierContract,
  CourierStore,
  Paginated,
} from "./types";

export interface ListStoresParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  q?: string;
  page?: number;
  limit?: number;
}

/** Courier-scoped store discovery + contract management. */
export const contractsApi = {
  listStores: async (params: ListStoresParams = {}): Promise<Paginated<CourierStore>> => {
    const { data } = await api.get<Paginated<CourierStore>>("/courier/stores", {
      params,
    });
    return data;
  },
  listContracts: async (status?: ContractStatus): Promise<CourierContract[]> => {
    const { data } = await api.get<CourierContract[]>("/courier/contracts", {
      params: status ? { status } : {},
    });
    return data;
  },
  request: async (storeId: string, message?: string): Promise<CourierContract> => {
    const { data } = await api.post<CourierContract>("/courier/contracts", {
      storeId,
      message,
    });
    return data;
  },
  cancel: async (id: string, reason?: string): Promise<CourierContract> => {
    const { data } = await api.post<CourierContract>(
      `/courier/contracts/${id}/cancel`,
      { reason },
    );
    return data;
  },
};
