"use client";

import { MapPin, Store as StoreIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDistance } from "@/lib/format";
import { CONTRACT_STATUS_META } from "./status";
import type { CourierStore } from "./types";

interface Props {
  store: CourierStore;
  busy: boolean;
  onRequest: (storeId: string) => void;
  onCancel: (contractId: string) => void;
}

export function StoreContractCard({ store, busy, onRequest, onCancel }: Props) {
  const c = store.contract;
  const meta = c ? CONTRACT_STATUS_META[c.status] : null;

  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-ink-faint">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
        ) : (
          <StoreIcon className="h-5 w-5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-ink">{store.name}</p>
          {meta ? (
            <Badge tone={meta.tone}>
              {meta.label}
              {c?.isTemporary ? " (vaqtinchalik)" : ""}
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
          {store.address ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{store.address}</span>
            </span>
          ) : null}
          {store.distanceKm != null ? (
            <span className="shrink-0">{formatDistance(store.distanceKm)}</span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0">
        {!c || c.status === "REJECTED" || c.status === "REVOKED" ? (
          <Button size="sm" loading={busy} onClick={() => onRequest(store.id)}>
            {c ? "Qayta so'rash" : "Kontrakt so'rash"}
          </Button>
        ) : c.status === "PENDING" ? (
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={() => onCancel(c.id)}
          >
            Bekor qilish
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={() => onCancel(c.id)}
          >
            To&apos;xtatish
          </Button>
        )}
      </div>
    </Card>
  );
}
