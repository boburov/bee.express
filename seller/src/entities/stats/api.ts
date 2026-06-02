import { api } from "@/shared/auth/api";

export interface SellerDashboardSummary {
  ordersToday: number;
  revenueToday: number;
  activeProducts: number;
  storeRating: number;
  conversionPct: number;
}

export const statsApi = {
  dashboard: () =>
    api.get<SellerDashboardSummary>("/seller/stats/summary").then((r) => r.data),
};
