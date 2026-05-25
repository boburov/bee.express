import { PageHeader } from "@/shared/ui/PageHeader";
import { UsersTable } from "@/features/users/users-table/UsersTable";

/**
 * Faqat "seller" rolidagi foydalanuvchilar. Kelajakda do'kon (Store) moderatsiyasi
 * va KYC ro'yxati shu sahifaga qo'shiladi.
 */
export default function SellersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sotuvchilar"
        description="Sotuvchi rolida bo'lgan foydalanuvchilar. Do'kon yaratilmagan bo'lsa ham shu yerda ko'rinadi."
      />
      <UsersTable
        fixedRoleSlug="seller"
        emptyTitle="Hozircha sotuvchi yo'q"
        emptyDescription="Yangi sotuvchi qo'shish uchun foydalanuvchini topib, unga seller rolini biriktiring (Xaridorlar bo'limidan)."
      />
    </div>
  );
}
