import { ComingSoon } from "@/shared/ui/ComingSoon";

export default function OrdersPage() {
  return (
    <ComingSoon
      title="Buyurtmalar"
      description="Barcha buyurtmalar, filtrlar (sana, status, sotuvchi, kuryer, hudud)."
      next={[
        "Buyurtma list view + filtrlar",
        "Buyurtma tafsiloti — timeline, ishtirokchilar",
        "Muammoli buyurtmalarga aralashish (kuryer topilmagan, bekor qilingan)",
      ]}
    />
  );
}
