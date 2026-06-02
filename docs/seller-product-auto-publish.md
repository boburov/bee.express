# Sotuvchi mahsuloti — avto-publikatsiya (moderatsiyasiz)

Sotuvchi yaratgan mahsulot endi **darhol** xaridorlar (client) katalogida ko'rinadi.
Avval har bir mahsulot `PENDING` holatda admin moderatsiyasini kutardi; bu bosqich
olib tashlandi — mahsulot yaratilishi bilan `ACTIVE` bo'ladi.

## Maqsad

"Sotuvchi qo'shgan mahsulot client panelda ham ko'rinishi kerak" — sotuvchi mahsulot
qo'shganida u darhol xaridorga ko'rinsin, admin tasdig'ini kutmasin. Tanlangan
yondashuv: **avto-tasdiq (moderatsiyani o'tkazib yuborish)**.

## Qanday ishlaydi

Mahsulot client katalogida ko'rinishi uchun (`GET /v1/products`,
[`public-products.service.ts`](../server/src/public/products/public-products.service.ts#L127))
quyidagi shartlar bajarilishi kerak:

1. `product.status === 'ACTIVE'`
2. Kamida bitta `SellerOffer`: `isActive === true` va `stock > 0`
3. Do'kon: `status === 'ACTIVE'` va `isOpen === true`
4. **FOOD** kategoriyasi uchun: xaridor lokatsiyasi (lat/lng) do'kon xizmat radiusi ichida

Shu shartlardan **№1** ilgari `PENDING` bo'lgani uchun bloklab turardi. O'zgarish faqat
shu birinchi shartga tegishli — qolgan ish-mantiq (offer, do'kon, geo) o'zgarmadi.

### Server o'zgarishlari

[`server/src/seller/products/products.service.ts`](../server/src/seller/products/products.service.ts):

- **`create()`** — yangi mahsulot `status: 'ACTIVE'` + `publishedAt: new Date()` bilan
  yaratiladi (avval `status: 'PENDING'`).
- **`update()`** — tahrir endi `PENDING`'ga qaytarmaydi; mahsulot `ACTIVE` bo'lib qoladi
  (`publishedAt` saqlanadi, eski qatorlar uchun backfill qilinadi). Avval har tahrir
  qayta moderatsiyaga jo'natardi.

### Saqlanib qolgan narsalar

- Admin moderatsiya endpointlari (`/admin/moderation/products/:id/approve|reject`) va
  `ProductStatus` enum (`PENDING/ACTIVE/REJECTED/ARCHIVED`) **o'chirilmadi**. Admin
  istalgan vaqt mahsulotni `ARCHIVED` / `REJECTED` qila oladi (post-moderation).
- Admin "moderatsiyada" ro'yxati (`listPending`, `status: 'PENDING'` filtri) ishlaydi,
  faqat endi odatda bo'sh bo'ladi.
- Prisma schema `@default(PENDING)` o'zgarmadi — seller `create()` har doim aniq
  `ACTIVE` beradi, shuning uchun default boshqa oqimlarga (masalan product-requests)
  ta'sir qilmasligi uchun tegilmadi.

## Ekran / UX

[`seller/src/app/dashboard/products/new/page.tsx`](../seller/src/app/dashboard/products/new/page.tsx)
dagi matnlar yangilandi:

- Tugma: ~~"Yaratish va moderatsiyaga jo'natish"~~ → **"Yaratish va e'lon qilish"**.
- Offer izohi: mahsulot katalogda ko'rinishi uchun **narx + qoldiq (0 dan katta)** kerakligi
  aniq aytildi.
- Pastki izoh: ~~"avtomatik Moderatsiyada holatiga tushadi"~~ → **"darhol Faol bo'lib
  xaridorlar katalogida ko'rinadi"**.

## Migratsiya / ma'lumotlar

O'zgarish vaqtida bazada `PENDING` mahsulotlar **yo'q** edi (faqat 1 ta `ACTIVE`),
shuning uchun backfill kerak bo'lmadi. Agar kelajakda `PENDING` qatorlar paydo bo'lsa,
ularni `status='ACTIVE', publishedAt=now()` ga yangilash mumkin.

## Keyingi qadamlar

- (Ixtiyoriy) Agar keyinroq moderatsiya qaytarilsa — `create()` da `ACTIVE`'ni
  feature-flag orqali boshqarish (`AUTO_PUBLISH_PRODUCTS`).
- Sotuvchi narx/qoldiq kiritmasdan mahsulot yaratsa, u `ACTIVE` bo'lsa-da, offer yo'qligi
  sababli katalogda ko'rinmaydi — bu kutilgan xatti-harakat (sotib bo'lmaydigan mahsulot
  ko'rsatilmaydi). Kerak bo'lsa, kelajakda new wizard'da narx/qoldiqni majburiy qilish.
