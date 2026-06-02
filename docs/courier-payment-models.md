# Kuryer to'lov modellari + concurrency

## Yo'l haqqi (mijoz to'laydi) — radius + per-km (allaqachon mavjud)
Sotuvchi do'kon sozlamasida `deliveryRadiusKm` + `deliveryBaseFee` + `deliveryPerKmFee`
ni belgilaydi. Narx = baza + per-km × masofa, faqat radius ichida (FOOD gate).
StoreForm'da inputlar bor — o'zgartirilmadi.

## Kuryer to'lovi — 3 model, sotuvchi belgilaydi (kontraktda)
Yangi `CourierPaymentType` enum + `CourierContract.paymentType` + `paymentValue`
(migratsiya: `prisma/migrations/20260602100000_add_courier_payment`).

- **SALARY (Stabil/oylik)** — belgilangan oylik maosh; har-order daromadi = 0
  (offline hisob-kitob). `paymentValue` = oylik so'm.
- **PER_ORDER** — har yetkazilgan order uchun belgilangan summa (do'konning radius
  zonasi uchun). `paymentValue` = so'm/order.
- **PERCENT** — yo'l haqqining foizi. `paymentValue` = foiz (default 80 — eski xulq).

Kuryer daromadi (`courierEarning`) biriktirish vaqtida kontrakt sozlamasidan
hisoblanadi (`computeContractEarning` — `courier.serializer.ts`) va orderga snapshot
qilinadi. 3 ta biriktirish nuqtasi: avto-dispatch (`onOrderReady`), sotuvchi qo'lda
(`assignToCourier`), kuryer pool'dan (`accept`) — hammasi kontraktni o'qiydi; kontrakt
yo'q bo'lsa default 80% (`estimateCourierEarning`).

**Sotuvchi belgilaydi:** `PATCH /seller/contracts/:id/payment` { paymentType, paymentValue }.
UI: Kuryerlar sahifasida har ACTIVE/PENDING kontraktda `ContractPaymentEditor` —
3 ta tugma (Foiz/Har order/Oylik) + qiymat inputi + Saqlash. Joriy to'lov ko'rinib turadi.

## Concurrency — kuryer bir vaqtda 1 order
`CourierService.accept()` ga cheklov qo'shildi: kuryer faol order'ga (COURIER_ASSIGNED/
ON_WAY) ega bo'lsa, pool'dan yangisini ololmaydi ("Sizda faol buyurtma bor"). Avto-dispatch
allaqachon `MAX_CONCURRENT_PER_COURIER = 1` ni hisobga olardi.

## Tekshiruv
- server `tsc` + `nest build` toza · 4 frontend + bot `tsc` toza · yangi kod lint-toza.

## Deploy
- VPS DB'da migratsiyani qo'llang: `npx prisma migrate deploy` (server). Eski kontraktlar
  default PERCENT 80% bilan ishlaydi — buzilmaydi.
- server restart.
