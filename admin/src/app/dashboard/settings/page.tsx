import { ComingSoon } from "@/shared/ui/ComingSoon";

export default function SettingsPage() {
  return (
    <ComingSoon
      title="Sozlamalar"
      description="Tizim umumiy sozlamalari, default komissiya, bildirishnomalar."
      next={[
        "Default komissiya foizlari",
        "Yetkazib berish formulasi (kategoriya bo'yicha)",
        "Bildirishnoma shabloni",
        "Admin foydalanuvchilarni boshqarish",
      ]}
    />
  );
}
