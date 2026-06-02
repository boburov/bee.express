"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Power, XCircle } from "lucide-react";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { storeApi } from "./api";
import type { Store } from "./types";

interface StatusBannerProps {
  store: Store;
  onUpdated: (next: Store) => void;
}

/**
 * Status banner — shows where the store is in the moderation lifecycle and
 * exposes the Open/Close toggle (ACTIVE stores only). Color reflects state.
 */
export function StatusBanner({ store, onUpdated }: StatusBannerProps) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const next = await storeApi.toggleOpen(!store.isOpen);
      onUpdated(next);
    } finally {
      setBusy(false);
    }
  }

  const cfg = (() => {
    switch (store.status) {
      case "PENDING":
        return {
          icon: <Clock className="h-5 w-5" />,
          title: "Tasdiqlash kutilmoqda",
          statusLabel: "Kutilmoqda",
          body: "Admin do'koningizni ko'rib chiqmoqda. Tasdiqlangach buyurtma qabul qila boshlaysiz.",
          tone: "info" as const,
          bg: "bg-sky-50 border-sky-100",
          icoColor: "text-sky-600 bg-sky-100",
        };
      case "ACTIVE":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          title: "Do'kon faol",
          statusLabel: "Faol",
          body: "Buyurtma qabul qilyapsiz. Vaqtinchalik to'xtatish uchun Yopish tugmasini bosing.",
          tone: "success" as const,
          bg: "bg-green-50 border-green-100",
          icoColor: "text-green-600 bg-green-100",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="h-5 w-5" />,
          title: "Do'kon rad etildi",
          statusLabel: "Rad etilgan",
          body: store.rejectionReason
            ? `Sabab: ${store.rejectionReason}`
            : "Admin do'koningizni rad etdi. Ma'lumotlarni tahrirlab qayta jo'nating.",
          tone: "danger" as const,
          bg: "bg-red-50 border-red-100",
          icoColor: "text-red-600 bg-red-100",
        };
      case "SUSPENDED":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Do'kon to'xtatildi",
          statusLabel: "To'xtatilgan",
          body: "Admin tomonidan vaqtincha to'xtatildi. Iltimos admin bilan bog'laning.",
          tone: "warning" as const,
          bg: "bg-amber-50 border-amber-100",
          icoColor: "text-amber-600 bg-amber-100",
        };
      default:
        // Defensive: an unmapped status from the backend should never
        // white-screen the dashboard — fall back to a neutral banner.
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Do'kon holati",
          statusLabel: "Noma'lum",
          body: "Do'kon holati aniqlanmadi.",
          tone: "neutral" as const,
          bg: "bg-surface-2 border-line",
          icoColor: "text-ink-muted bg-surface-3",
        };
    }
  })();

  return (
    <Card className={`${cfg.bg}`}>
      <div className="p-4 flex items-start gap-3">
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.icoColor}`}>
          {cfg.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-ink">{cfg.title}</h3>
            <Badge tone={cfg.tone}>{cfg.statusLabel}</Badge>
            {store.status === "ACTIVE" ? (
              <Badge tone={store.isOpen ? "success" : "warning"}>
                {store.isOpen ? "Ochiq" : "Yopiq"}
              </Badge>
            ) : null}
          </div>
          <p className="text-xs text-ink-soft">{cfg.body}</p>
        </div>
        {store.status === "ACTIVE" ? (
          <Button
            size="sm"
            variant={store.isOpen ? "outline" : "primary"}
            onClick={toggle}
            loading={busy}
            leftIcon={<Power className="h-4 w-4" />}
          >
            {store.isOpen ? "Yopish" : "Ochish"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
