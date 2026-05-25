import { PageHeader } from "@/shared/ui/PageHeader";
import { RolesList } from "@/features/roles/roles-list/RolesList";

export default function RolesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Rollar"
        description="Foydalanuvchi rollari va ularning ruxsatlar (permissions) to'plami. Tizim rollarini (admin, seller, courier, customer) o'chirib bo'lmaydi."
      />
      <RolesList />
    </div>
  );
}
