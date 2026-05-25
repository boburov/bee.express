"use client";

import { useState } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SendNotificationForm } from "@/features/notifications/send-notification/SendForm";
import { HistoryList } from "@/features/notifications/history/HistoryList";

export default function NotificationsPage() {
  // Bump on every successful send → HistoryList refetches.
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Bildirishnomalar"
        description="Foydalanuvchilarga (hamma, rol bo'yicha yoki aniq tanlangan) realtime push xabar yuborish. Yuborilganlar tarixi pastda."
      />

      <SendNotificationForm onSent={() => setRefreshKey((k) => k + 1)} />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-ink">Yuborilganlar tarixi</h2>
        <HistoryList refreshKey={refreshKey} />
      </section>
    </div>
  );
}
