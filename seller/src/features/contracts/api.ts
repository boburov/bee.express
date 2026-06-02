import { api } from "@/shared/auth/api";
import type { CourierPaymentType, ContractStatus, SellerContract } from "./types";

/**
 * Seller-scoped courier contracts API. Backend enforces @Roles("seller") and
 * resolves the seller's store from the JWT — only that store's contracts are
 * visible/actionable.
 */
export const sellerContractsApi = {
  list: async (status?: ContractStatus): Promise<SellerContract[]> => {
    const { data } = await api.get<SellerContract[]>("/seller/contracts", {
      params: status ? { status } : {},
    });
    return data;
  },
  approve: async (id: string): Promise<SellerContract> => {
    const { data } = await api.patch<SellerContract>(`/seller/contracts/${id}/approve`);
    return data;
  },
  reject: async (id: string, reason: string): Promise<SellerContract> => {
    const { data } = await api.patch<SellerContract>(`/seller/contracts/${id}/reject`, {
      reason,
    });
    return data;
  },
  revoke: async (id: string, reason?: string): Promise<SellerContract> => {
    const { data } = await api.patch<SellerContract>(`/seller/contracts/${id}/revoke`, {
      reason,
    });
    return data;
  },
  setPayment: async (
    id: string,
    paymentType: CourierPaymentType,
    paymentValue: number,
  ): Promise<SellerContract> => {
    const { data } = await api.patch<SellerContract>(`/seller/contracts/${id}/payment`, {
      paymentType,
      paymentValue,
    });
    return data;
  },
};
