# Kuryer — Google Maps platforma ichida (iframe) + ish vaqti (mavjud)

## Talab
1. Kuryer avval faqat tashqi Google Maps'ga **yo'naltirilardi** (deeplink). Endi
   Google Maps platformaning **o'zida iframe** ko'rinishida ham ochilsin.
2. Sotuvchilar **ish vaqtini** kirita olishsin.

## 2-talab allaqachon bor edi
Sotuvchi ish vaqti to'liq ishlaydi — qayta yozilmadi:
- **Backend:** `Store.openingHours` (Json), `isStoreOpenNow()` checkout
  (`orders.service.ts`) va nearby (`public-stores.service.ts`) da tekshiriladi.
- **Seller UI:** Do'kon sahifasi → **"Ish vaqti"** bo'limi
  (`seller/src/features/store/OpeningHoursEditor.tsx`, `StoreForm.tsx:333`) —
  7 kun, har biri uchun ochilish/yopilish vaqti.
- Tafsilot: [store-opening-hours.md](store-opening-hours.md).

Tuzatish: `StoreForm.tsx` doc-izohidagi eskirgan *"openingHours UI — ... we don't
surface it"* qatori olib tashlandi (kod allaqachon ko'rsatyapti).

## Yangi — Google Maps iframe (kuryer)
Kuryer buyurtma sahifasida (`courier/src/app/dashboard/deliveries/[id]/page.tsx`)
"Yo'nalish" kartasi endi **Google Maps Embed API** orqali yo'nalishni **ilova
ichida** ko'rsatadi — Maps saytiga chiqmasdan.

**Helper:** `courier/src/features/deliveries/status.ts` → `googleMapsEmbed(...)`
```
https://www.google.com/maps/embed/v1/directions
  ?key=<KEY>&origin=<lat,lng>&destination=<lat,lng>&mode=driving
```
- **origin:** kuryerning jonli GPS'i (ruxsat berilgach), aks holda **olish
  manzili (sotuvchi)** — shunda route doim chiziladi.
- **destination:** mijoz manzili (`order.dropoff`).
- GPS ruxsat berilgach `src` yangilanadi va iframe kuryer→mijoz route'iga o'tadi.

**Fallback:** Embed API kaliti bo'lmasa `googleMapsEmbed` `null` qaytaradi va
sahifa avvalgi **Leaflet/OpenStreetMap** xaritasiga (pin + tutash chiziq)
qaytadi. Tashqi **"Google Maps orqali yo'nalish"** tugmasi va Yandex havolasi
har holatda saqlanadi (haqiqiy turn-by-turn navigatsiya uchun).

## Konfiguratsiya — Google Maps Embed API kaliti
- **Env:** `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` (`courier/.env.example` da
  hujjatlangan, `courier/src/lib/env.ts` → `env.mapsEmbedKey`).
- Google Cloud'da loyiha ochib **"Maps Embed API"** ni yoqing, kalit yarating.
- Kalitni **HTTP referrer** bo'yicha kuryer domeni (masalan
  `courier.beexpress.uz/*`, lokalda `localhost`) bilan cheklang — `NEXT_PUBLIC_*`
  bo'lgani uchun u brauzer bundle'iga kiradi.
- **Maps Embed API bepul** — har yuklash uchun to'lov yo'q.
- Kalit kiritilmaguncha iframe ko'rinmaydi (Leaflet fallback ishlaydi).

## Tegilgan fayllar
- `courier/src/lib/env.ts` — `mapsEmbedKey` qo'shildi.
- `courier/src/features/deliveries/status.ts` — `googleMapsEmbed()` helper.
- `courier/src/app/dashboard/deliveries/[id]/page.tsx` — iframe + Leaflet fallback.
- `courier/.env.example` — `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY`.
- `seller/src/features/store/StoreForm.tsx` — eskirgan izoh tozalandi.

## Tekshirildi
- `npx tsc --noEmit` (courier) — toza.
- `eslint` — yangi xato yo'q (faqat avvaldan bor `formatPhoneNumber` warning).
