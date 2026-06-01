import { api } from "@/lib/api";
import type {
  AvailableResponse,
  CourierOrder,
  CourierProfile,
  CourierStats,
  Paginated,
  TransportType,
} from "./types";

export interface UpdateCourierStatusDto {
  status: "ON_WAY" | "DELIVERED";
  note?: string;
}

export interface UpdateCourierProfileDto {
  firstName?: string;
  lastName?: string;
  transportType?: TransportType;
  workRadiusKm?: number;
  categories?: string[];
  isOnline?: boolean;
}

/**
 * Courier-scoped API. Backend enforces @Roles("courier") and derives the
 * courier id from the JWT — the URLs never carry a courier id.
 */
export const courierApi = {
  available: async (
    params: { lat?: number; lng?: number; radiusKm?: number } = {},
  ): Promise<AvailableResponse> => {
    const { data } = await api.get<AvailableResponse>("/courier/available", { params });
    return data;
  },
  accept: async (id: string): Promise<CourierOrder> => {
    const { data } = await api.post<CourierOrder>(`/courier/orders/${id}/accept`);
    return data;
  },
  listMine: async (
    params: { scope?: "active" | "history"; page?: number; limit?: number } = {},
  ): Promise<Paginated<CourierOrder>> => {
    const { data } = await api.get<Paginated<CourierOrder>>("/courier/orders", { params });
    return data;
  },
  get: async (id: string): Promise<CourierOrder> => {
    const { data } = await api.get<CourierOrder>(`/courier/orders/${id}`);
    return data;
  },
  updateStatus: async (id: string, dto: UpdateCourierStatusDto): Promise<CourierOrder> => {
    const { data } = await api.patch<CourierOrder>(`/courier/orders/${id}/status`, dto);
    return data;
  },
  release: async (id: string, reason?: string): Promise<{ ok: boolean }> => {
    const { data } = await api.post<{ ok: boolean }>(`/courier/orders/${id}/release`, { reason });
    return data;
  },
  stats: async (): Promise<CourierStats> => {
    const { data } = await api.get<CourierStats>("/courier/stats");
    return data;
  },
  getProfile: async (): Promise<CourierProfile> => {
    const { data } = await api.get<CourierProfile>("/courier/profile");
    return data;
  },
  updateProfile: async (dto: UpdateCourierProfileDto): Promise<CourierProfile> => {
    const { data } = await api.patch<CourierProfile>("/courier/profile", dto);
    return data;
  },
};
