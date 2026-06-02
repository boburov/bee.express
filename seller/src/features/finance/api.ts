import { api } from "@/shared/auth/api";

export interface SellerFinanceSummary {
  deliveredOrders: number;
  productSales: number;
  deliveryFees: number;
  grossSales: number;
  todayOrders: number;
  todayProductSales: number;
  activeOrders: number;
}

export const financeApi = {
  summary: () =>
    api.get<SellerFinanceSummary>("/seller/finance/summary").then((r) => r.data),
};
