import { PageHeader } from "@/shared/ui/PageHeader";
import { UsersTable } from "@/features/users/users-table/UsersTable";

/**
 * Faqat "courier" rolidagi foydalanuvchilar. Kelajakda kuryer turi
 * (o'zimizniki / sotuvchi / erkin) va ish radiusi shu sahifaga qo'shiladi.
 */
export default function CouriersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kuryerlar"
        description="Kuryer rolida bo'lgan foydalanuvchilar. Hujjat va transport tafsilotlari keyingi bosqichda qo'shiladi."
      />
      <UsersTable
        fixedRoleSlug="courier"
        emptyTitle="Hozircha kuryer yo'q"
        emptyDescription="Yangi kuryer qo'shish uchun foydalanuvchini topib, unga courier rolini biriktiring."
      />
    </div>
  );
}
