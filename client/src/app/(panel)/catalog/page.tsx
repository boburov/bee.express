import { Search } from "lucide-react";
import { EmptyState } from "@/shared/ui/EmptyState";
import { PageHeader } from "@/shared/ui/PageHeader";

export default function CatalogPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Katalog"
        description="Kategoriyalar, sotuvchilar va yaqin atrofdagi takliflar."
      />
      <EmptyState
        icon={<Search className="h-6 w-6" />}
        title="Tez orada"
        description="Yaqin atrofdagi sotuvchilar va kategoriyalar bo'yicha qidiruv keyingi bosqichda ochiladi."
      />
    </div>
  );
}
