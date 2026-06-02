# Xaridor manzili — xarita orqali (F3)

Talab: foydalanuvchi locationni **xarita** orqali tanlay olsin (avval faqat
qo'lda lat/lng koordinata edi — map bilan almashtirildi).

## O'zgarish
- `client/package.json` ga `leaflet ^1.9.4` + `@types/leaflet ^1.9.21` qo'shildi
  (seller'da allaqachon shu versiyalar — monorepoda bor). `npm install` qilindi.
- Yangi `client/src/features/addresses/LocationPicker.tsx` — seller'ning Leaflet
  picker'idan port (radius/circle olib tashlangan). Browser-only: Leaflet runtime
  effekt ichida `await import("leaflet")` orqali (SSR'da `window` xatosi yo'q);
  faqat CSS statik import. Pin'ni surish yoki xaritani bosish lat/lng emit qiladi.
- `client/src/features/addresses/AddressForm.tsx` — qo'lda lat/lng Input'lari
  **xarita bilan almashtirildi** (`next/dynamic`, `ssr: false`). "Hozirgi
  joylashuvni olish" (GPS) tugmasi qoldi — bosilganda xarita markazi ko'chadi.
  `latitude`/`longitude` string state asosiy manba bo'lib qoladi (submit
  validatsiyasi o'zgarmagan); bo'sh koordinata uchun guard qo'shildi.

## Radius (F4-radius)
Manzil do'kon radiusi tashqarisida bo'lsa buyurtma berib bo'lmaydi — bu allaqachon
ishlaydi (oldingi `POST /orders/quote` preview + checkout FOOD radius gate,
`effectiveFoodRadiusKm`). Skaut tasdiqladi: checkout gate yetarli; alohida
manzil-pick warning kerak emas (MVP).

## Tekshiruv
- client `tsc` + lint toza. (Prod build map'ni dynamic ssr:false bilan yuklaydi.)
