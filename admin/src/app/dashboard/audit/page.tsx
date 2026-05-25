import { PageHeader } from "@/shared/ui/PageHeader";
import { AuditList } from "@/features/audit/audit-list/AuditList";

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit log"
        description="Tizimda kim qachon nimani o'zgartirgan — to'liq tarix. Har bir kirish, bloklash, rol va katalog amali shu yerda."
      />
      <AuditList />
    </div>
  );
}
