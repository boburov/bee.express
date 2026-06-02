import { TRANSPORT_META } from "./transport";

/**
 * Prominent transport-type pill (icon + label) so the seller instantly sees a
 * courier's vehicle when a request arrives or when assigning an order.
 */
export function TransportBadge({ type }: { type: string | null | undefined }) {
  if (!type) return null;
  const meta = TRANSPORT_META[type];
  const Icon = meta?.Icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
      {Icon ? <Icon className="h-4 w-4" strokeWidth={1.75} /> : null}
      {meta?.label ?? type}
    </span>
  );
}
