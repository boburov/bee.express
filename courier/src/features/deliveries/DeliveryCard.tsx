import Link from "next/link";
import { ArrowRight, MapPin, Navigation, Package } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { COURIER_STATUS_META } from "./status";
import type { CourierOrder } from "./types";
import { formatDistance, formatSum } from "@/lib/format";

interface DeliveryCardProps {
  order: CourierOrder;
  /** Optional CTA rendered at the bottom (e.g. an Accept button for the pool). */
  footer?: React.ReactNode;
  href?: string;
}

/** Compact order card shared by the deliveries, active, and history lists. */
export function DeliveryCard({ order, footer, href }: DeliveryCardProps) {
  const meta = COURIER_STATUS_META[order.status];

  const body = (
    <div className="rounded-2xl border border-line bg-surface p-4 transition-colors hover:bg-surface-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-ink">{order.orderNumber}</span>
        <Badge tone={meta.tone}>{meta.label}</Badge>
      </div>

      <p className="flex items-center gap-1.5 text-sm text-ink-soft">
        <MapPin className="h-4 w-4 shrink-0 text-ink-muted" />
        <span className="truncate">{order.pickup.storeName}</span>
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1">
          <Navigation className="h-3.5 w-3.5" />
          {order.pickupDistanceKm != null
            ? `Sizdan ${formatDistance(order.pickupDistanceKm)}`
            : `Yetkazish ${formatDistance(order.distanceKm)}`}
        </span>
        <span className="inline-flex items-center gap-1">
          <Package className="h-3.5 w-3.5" />
          {order.itemsCount} ta mahsulot
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3">
        <div className="text-xs text-ink-muted">
          Daromad
          <span className="ml-1 text-sm font-semibold text-brand-700">
            {formatSum(order.earning)}
          </span>
        </div>
        {href ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted">
            Tafsilot <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
