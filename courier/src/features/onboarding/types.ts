import type { TransportType } from "@/features/deliveries/types";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** Mirrors server CourierOnboardingService.serialize. */
export interface CourierApplication {
  id: string;
  status: ApplicationStatus;
  transportType: TransportType | null;
  fullName: string | null;
  note: string | null;
  documentUrls: string[];
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingState {
  isCourier: boolean;
  application: CourierApplication | null;
}

export interface ApplyDto {
  transportType: TransportType;
  fullName?: string;
  note?: string;
  documentUrls?: string[];
}
