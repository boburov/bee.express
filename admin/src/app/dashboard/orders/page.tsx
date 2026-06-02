import { PageHeader } from "@/shared/ui/PageHeader";
import { OrdersList } from "@/features/orders/orders-list/OrdersList";

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buyurtmalar"
        description="Barcha sotuvchilar bo'yicha buyurtmalar — holat va raqam bo'yicha filtr, har birining to'liq tarixi."
      />
      <OrdersList />
    </div>
  );
}
