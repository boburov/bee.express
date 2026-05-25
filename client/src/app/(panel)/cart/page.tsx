import { ShoppingCart } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";

export default function CartPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Savat"
        description="Tanlangan mahsulotlar va yetkazib berish manzili."
      />
      <EmptyState
        icon={<ShoppingCart className="h-6 w-6" />}
        title="Savat bo'sh"
        description="Hozircha hech narsa tanlanmagan."
      />
    </div>
  );
}
