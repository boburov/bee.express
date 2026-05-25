import { PageHeader } from "@/shared/ui/PageHeader";
import { UsersTable } from "@/features/users/users-table/UsersTable";

/**
 * Telegram orqali kirgan barcha foydalanuvchilar. Sotuvchi/kuryer rollari
 * berilmagan oddiy foydalanuvchilar shu yerda — shuning uchun rol filtri yo'q.
 * Admin xohlasa Rollar bo'limidan kerakli rolni biriktiradi.
 */
export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Xaridorlar"
        description="Telegram orqali ro'yxatdan o'tgan barcha foydalanuvchilar. Bu yerdan rol biriktirish, qidirish va bloklash mumkin."
      />
      <UsersTable
        emptyTitle="Hozircha foydalanuvchi yo'q"
        emptyDescription="Yangi foydalanuvchilar Telegram Mini App orqali kirganda shu yerda paydo bo'ladi."
      />
    </div>
  );
}
