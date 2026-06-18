import { api } from "@/shared/auth/api";

export interface DashboardSummary {
  ordersToday: number;
  revenueToday: number;
  productSalesMonth: number;
  activeCouriers: number;
  workingCouriers: number;
  activeStores: number;
  newSignupsToday: number;
  conversionPct: number;
}

export interface FinanceSummary {
  deliveredOrders: number;
  grossSales: number;
  productSales: number;
  deliveryFees: number;
  courierPayouts: number;
  platformCommission: number;
}

/** One day's bucket for the dashboard trend chart. */
export interface DailyPoint {
  /** YYYY-MM-DD (local). */
  date: string;
  orders: number;
  revenue: number;
}

export const statsApi = {
  dashboard: () =>
    api.get<DashboardSummary>("/admin/stats/summary").then((r) => r.data),
  timeseries: (days = 14) =>
    api
      .get<DailyPoint[]>("/admin/stats/timeseries", { params: { days } })
      .then((r) => r.data),
  finance: (params: { from?: string; to?: string } = {}) =>
    api.get<FinanceSummary>("/admin/finance/summary", { params }).then((r) => r.data),
};

/** Uzbek so'm with thousands separators. */
export function som(n: number): string {
  return `${n.toLocaleString("ru-RU")} so'm`;
}
