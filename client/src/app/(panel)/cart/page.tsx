import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";

export default function CartPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Savat"
        description="Tanlangan mahsulotlar va yetkazib berish manzili."
      />

      <EmptyState
        icon={<ShoppingBag className="h-6 w-6" />}
        title="Savat hozircha bo'sh"
        description="Katalogdan birinchi mahsulotingizni tanlang — narxi, qoldig'i va yetkazib berish vaqti darhol ko'rinadi."
        action={
          <Link href="/catalog">
            <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
              Katalogni ochish
            </Button>
          </Link>
        }
      />
    </div>
  );
}
