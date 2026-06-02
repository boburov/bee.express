import { Bike, Car, Footprints, Motorbike, Truck, type LucideIcon } from "lucide-react";

export interface TransportMeta {
  label: string;
  Icon: LucideIcon;
}

/** Courier transport types (server CourierApplication.transportType). */
export const TRANSPORT_META: Record<string, TransportMeta> = {
  WALK: { label: "Piyoda", Icon: Footprints },
  BICYCLE: { label: "Velosiped", Icon: Bike },
  MOTORBIKE: { label: "Mototsikl", Icon: Motorbike },
  CAR: { label: "Mashina", Icon: Car },
  TRUCK: { label: "Yuk mashinasi", Icon: Truck },
};

export function transportLabel(type: string | null | undefined): string {
  if (!type) return "—";
  return TRANSPORT_META[type]?.label ?? type;
}
