# Do'kon ish vaqti (opening hours) + radius/yo'l kira (mavjud)

## Allaqachon bor edi
- **Radius cheklovi:** do'kon `deliveryRadiusKm` belgilaydi; FOOD uchun checkout +
  browse + nearby radiusdan tashqariga xizmat qilmaydi (`effectiveFoodRadiusKm`).
- **Per-km yo'l kira:** do'kon `deliveryBaseFee` + `deliveryPerKmFee` belgilaydi;
  narx = baza + per-km × masofa. StoreForm'da inputlar bor.

## Yangi — ish vaqti
Backend `Store.openingHours` (Json) ni qabul qilardi, lekin UI yo'q va hech qayerda
tekshirilmasdi. Endi:

**Helper:** `server/src/common/store-hours.ts` `isStoreOpenNow(openingHours, now?)`.
Haftalik jadval `{ mon: { open: "09:00", close: "22:00" }, ... }`. Kun yo'q/null = o'sha
kun yopiq. Butun jadval bo'sh = doim ochiq (faqat qo'lda Ochiq/Yopiq). Tungi oraliq
(close < open, masalan 22:00–02:00) ham qo'llab-quvvatlanadi. Server local vaqti
(VPS Asia/Tashkent kutiladi).

**Enforcement:**
- **Checkout** (`orders.service.ts`): `isStoreOpenNow` false bo'lsa
  *"... hozir ish vaqtida emas"* — buyurtma rad etiladi.
- **Nearby** (`public-stores.service.ts`): ish vaqtidan tashqaridagi do'konlar
  ro'yxatda **ko'rinmaydi** (manual `isOpen` allaqachon SQL'da filtrlanadi).

**Seller UI:** `OpeningHoursEditor` (`seller/src/features/store/`) — 7 kun, har biri
uchun ochiq/yopiq toggle + ochilish/yopilish vaqti (`<input type="time">`). StoreForm'ga
"Ish vaqti" Card sifatida qo'shildi; `openingHours` mavjud Create/Update DTO orqali saqlanadi.

## Tekshiruv
- server `tsc` + `nest build` toza · 4 frontend `tsc` toza · yangi kod lint-toza
  (StoreForm'dagi qolgan `no-unescaped` xatolar pre-existing).

## Eslatma
- Ish vaqti server local vaqtiga qarab baholanadi — VPS timezone Asia/Tashkent bo'lsin.
- Migratsiya kerak emas (`openingHours` ustuni allaqachon bor).
