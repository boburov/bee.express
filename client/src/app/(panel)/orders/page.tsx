import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Buyurtmalar"
        description="Joriy buyurtmalar va o'tgan tarix shu yerda ko'rinadi."
      />

      <EmptyState
        icon={<PackageSearch className="h-6 w-6" />}
        title="Hozircha buyurtma yo'q"
        description="Birinchi buyurtmangizdan keyin holatini real vaqtda kuzata olasiz: sotuvchi qabul qildi, kuryer yo'lda, yetkazildi."
        action={
          <Link href="/catalog">
            <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
              Buyurtma boshlash
            </Button>
          </Link>
        }
      />
    </div>
  );
}
