import { ComingSoon } from "@/shared/ui/ComingSoon";

export default function FinancePage() {
  return (
    <ComingSoon
      title="Moliya"
      description="Komissiya, sotuvchi va kuryer to'lovlari, hisobotlar."
      next={[
        "Kunlik / oylik tushum",
        "Sotuvchilar va kuryerlarga to'lov hisoboti",
        "Platforma sof daromadi",
        "Excel eksport",
      ]}
    />
  );
}
