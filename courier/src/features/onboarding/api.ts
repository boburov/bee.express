import { api } from "@/lib/api";
import type { ApplyDto, CourierApplication, OnboardingState } from "./types";

/**
 * Courier onboarding API. Reachable by any authenticated user (the backend
 * route carries no role guard) — this is the surface a not-yet-courier uses to
 * apply and to poll their application status.
 */
export const onboardingApi = {
  me: async (): Promise<OnboardingState> => {
    const { data } = await api.get<OnboardingState>("/courier/onboarding/me");
    return data;
  },
  apply: async (dto: ApplyDto): Promise<CourierApplication> => {
    const { data } = await api.post<CourierApplication>(
      "/courier/onboarding/apply",
      dto,
    );
    return data;
  },
};
