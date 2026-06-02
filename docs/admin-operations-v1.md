# Admin operatsiyalari — Buyurtmalar, Dashboard, Moliya (W3)

TZ §18.1 / §18.6 / §18.7. Avval bu sahifalar `ComingSoon` (orders, finance) yoki
qattiq "—" (dashboard) edi va backend'da mos endpoint yo'q edi.

## Backend (yangi, SuperAdminOnly)

Hammasi mavjud Prisma maydonlaridan o'qiydi — **migratsiya yo'q**, faqat aggregat/list.

### `GET /admin/orders` + `GET /admin/orders/:id` — `server/src/admin/orders/`
Cross-tenant buyurtma ro'yxati (filtr: `status`, `q`=orderNumber, `storeId`,
`from`/`to`, pagination) va tafsilot. Mavjud `ORDER_INCLUDE` + `serializeOrder`
ni qayta ishlatadi — admin ko'rinishi customer/seller payload bilan bir xil.
Faqat o'qish; "aralashish" amallari keyinga qoldirildi.

### `GET /admin/stats/summary` — `server/src/admin/stats/`
Dashboard ko'rsatkichlari: `ordersToday`, `revenueToday` (bugun yetkazilganlar
`total` yig'indisi), `activeCouriers` (role=courier, bloklanmagan), `activeStores`
(status=ACTIVE), `newSignupsToday`, `conversionPct` (yetkazilgan/jami).

### `GET /admin/finance/summary?from&to` — `server/src/admin/stats/`
Yetkazilgan buyurtmalar bo'yicha: `deliveredOrders`, `grossSales` (total),
`productSales` (subtotal), `deliveryFees`, `courierPayouts` (courierEarning),
`platformCommission` = `deliveryFees − courierPayouts`. MVP'da platforma daromadi
modeli — yetkazib berish marjasi (alohida payout/settlement modeli yo'q).

Modullar `AdminModule` ga ulandi (`AdminOrdersModule`, `AdminStatsModule`).

## Frontend (admin, FSD: entities/order, entities/stats, features/orders)

- **Buyurtmalar** — `app/dashboard/orders/page.tsx` endi `OrdersList`
  (`features/orders/orders-list`): holat filtri + raqam qidiruvi + pagination,
  AuditList shabloniga mos. Har bir qator `/dashboard/orders/[id]` ga link.
- **Buyurtma tafsiloti** — yangi `app/dashboard/orders/[id]/page.tsx`: mahsulotlar,
  jami, **holatlar tarixi (timeline)**, xaridor + manzil + to'lov.
- **Boshqaruv** — `app/dashboard/page.tsx` endi client komponent, `statsApi.dashboard()`
  bilan 6 ta kartani real to'ldiradi ("—" o'rniga).
- **Moliya** — `app/dashboard/finance/page.tsx` endi `statsApi.finance()` summary
  kartalarini ko'rsatadi.

Yangi: `entities/order/{types,api}.ts`, `entities/stats/api.ts`,
`features/orders/orders-list/OrdersList.tsx`.

## Tekshiruv
- Server: `tsc --noEmit` toza · `nest build` toza (DI: AdminOrders/AdminStats modullari).
- Admin: `tsc --noEmit` toza. Dashboard/finance/stats — lint toza. OrdersList va
  orders/[id] da qolgan `set-state-in-effect` flag pre-existing pattern (AuditList
  va boshqa barcha FSD feature'lar bir xil `useEffect(() => { refresh(); }, [refresh])`
  ishlatadi).

## Keyinga qoldirildi
- **Sozlamalar (W3d)** — komissiya stavkasi / yetkazib berish formulasini
  sozlanuvchi qilish. Bu yangi Prisma model + migratsiya talab qiladi (hozir
  komissiya = `COURIER_DELIVERY_SHARE` konstantasi, yetkazish = kategoriya/do'kon
  defaultlari). Alohida qaror sifatida ko'rib chiqiladi.
- Admin orders "aralashish" amallari (kuryer qayta tayinlash, majburiy bekor).
- Finance: davr filtri UI + sotuvchi/kuryer payout breakdown + Excel eksport.
