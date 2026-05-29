"use client";

import { Store as StoreIcon } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Spinner } from "@/shared/ui/Spinner";
import { StatusBanner } from "@/features/store/StatusBanner";
import { StoreForm } from "@/features/store/StoreForm";
import { useMyStore } from "@/features/store/hooks";

export default function SellerStorePage() {
  const { data: store, loading, error, hasLoaded, setData } = useMyStore();

  // Initial load — render spinner once, then commit to either form or error.
  if (loading && !hasLoaded) {
    return <div className="flex justify-center py-10"><Spinner /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Do'kon" />
        <EmptyState
          icon={<StoreIcon className="h-6 w-6" />}
          title="Yuklanmadi"
          description={error}
        />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex flex-col gap-5 max-w-3xl">
        <PageHeader
          title="Do'kon yaratish"
          description="Buyurtma qabul qila boshlash uchun avval do'koningizni yarating. Admin tasdiqlagach faol bo'ladi."
        />
        <StoreForm onSaved={setData} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <PageHeader
        title="Do'kon"
        description="Do'kon ma'lumotlari, yetkazib berish sozlamalari va holati."
      />
      <StatusBanner store={store} onUpdated={setData} />
      <StoreForm initial={store} onSaved={setData} />
    </div>
  );
}
