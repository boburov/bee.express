import { ShoppingBag } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Buyurtmalar"
        description="Joriy buyurtmalar va o'tgan tarix bu yerda ko'rinadi."
      />
      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Hozircha buyurtma yo'q"
        description="Birinchi buyurtmangizni katalogdan boshlang."
      />
    </div>
  );
}
