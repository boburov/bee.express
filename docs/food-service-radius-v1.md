# FOOD xizmat radiusi (service radius) v1 — har do'kon o'z radiusi ichida ko'rinadi

Sotuvchi do'koni uchun **joylashuv + radius** kiritadi va FOOD kategoriyasidagi
xaridorlar do'konni **faqat shu radius ichida** ko'radi/buyurtma qiladi. Bu hujjat
ikki bo'shliqni yopadi:

1. **Backend** — browsing (mahsulot ro'yxati) paytida har bir do'konning **o'z**
   radiusi hisobga olinmasdi: bitta umumiy radius ishlatilardi, natijada radius
   tashqarisidagi do'kon ham ko'rinib, faqat **checkout**'da rad etilardi.
2. **Frontend (seller)** — joylashuv faqat `latitude`/`longitude` raqam maydonlari
   bilan kiritilardi; xaritada ko'rsatish/tanlash yo'q edi.

> Eslatma: location + radius maydonlari va checkout'dagi radius tekshiruvi
> **ilgaridan** mavjud edi (`Store.deliveryRadiusKm`, [orders.service.ts] FOOD
> gate). v1 ularni to'ldiradi — browsing'da ham radius gate, va xarita UI.

## Muammo (oldin)

- `GET /v1/products?categorySlug=<food>&lat&lng` — nomzod do'konlar
  `query.radiusKm ?? category.deliveryRadiusKm ?? 10` bo'yicha tanlanardi. Bu
  **do'konning o'z** `deliveryRadiusKm` ini e'tiborga olmasdi.
- Natija: 3 km radius belgilagan do'kon 8 km uzoqdagi xaridorga **ko'rinardi**,
  lekin u checkout'da `"... yetkazib berish radiusi: 3km, manzilingiz 8km"` bilan
  rad etilardi — yomon UX.
- `GET /v1/stores/nearby` ham faqat so'rovdagi `radiusKm` bo'yicha filtrlardi.

## Yechim

### `geo/geo.ts` — yagona radius manbasi

Yangi eksportlar:

| Nom | Qiymat | Maqsad |
| --- | --- | --- |
| `DEFAULT_FOOD_RADIUS_KM` | `10` | oxirgi fallback (do'kon ham, kategoriya ham radius bermaganda) |
| `MAX_FOOD_RADIUS_KM` | `100` | bounding-box scan chegarasi (DTO `@Max(100)` bilan mos) |
| `effectiveFoodRadiusKm(storeKm, categoryKm)` | — | `store ?? category ?? DEFAULT` — **bitta gate** |

`effectiveFoodRadiusKm` browse (list/nearby) va product detail'da **bir xil**
qo'llanadi — "bu do'konni umuman ko'ramanmi?" degan yagona qaror.

### `public-products.service.ts` — `list()`

- FOOD bo'lsa: do'kon faqat xaridor uning **o'z** xizmat radiusi ichida bo'lsa
  ko'rinadi (`d <= effectiveFoodRadiusKm(store.deliveryRadiusKm, category.deliveryRadiusKm)`).
- Bounding-box scan endi `query.radiusKm ?? MAX_FOOD_RADIUS_KM` bo'yicha — katta
  radiusli uzoq do'konni tushirib qoldirmaslik uchun. Xaridor `radiusKm` bersa,
  u qo'shimcha **yuqori chegara** bo'lib qoladi (do'kon radiusi VA xaridor
  qidiruv radiusi — ikkalasi ham bajarilishi shart).
- MARKETPLACE: radius gate yo'q (hamma joyga jo'natiladi) — geo faqat masofa/narx
  ko'rsatish uchun. (TZ: "faqat food katalogi uchun".)
- `getBySlug()` ham `effectiveFoodRadiusKm` ga o'tkazildi (avval inline
  `?? radiusKm ?? 10` edi) — `outOfRange` belgisi endi list bilan bir mantiqda.

### `public-stores.service.ts` — `nearby()`

- Endi har do'kon `deliveryRadiusKm` tanlanadi va `d > effectiveFoodRadiusKm(...)`
  bo'lsa tushiriladi — ya'ni "menga yetkazib bera oladigan" do'konlar qaytadi.

## Frontend (seller) — xarita orqali joylashuv

- **`features/store/LocationPicker.tsx`** (yangi) — Leaflet + OpenStreetMap
  (API kalitsiz). Xaritani bosib yoki to'q sariq nishonni **sudrab** nuqta
  tanlanadi; `radiusKm` bo'yicha **doira** real vaqtda chiziladi.
  - Leaflet **brauzer-only** — runtime `useEffect` ichida `import("leaflet")`
    bilan dinamik yuklanadi (SSR'da hech qachon ishlamaydi). Faqat CSS statik
    import. Nishon — inline SVG `divIcon` (rasm asseti kerak emas).
  - Controlled komponent: holat `StoreForm` da (`latitude`/`longitude`),
    `onChange(lat, lng)` orqali sinxron.
- **`StoreForm.tsx`** — `next/dynamic(..., { ssr: false })` bilan ulandi.
  "Aloqa va joylashuv" kartasida xarita; "Hozirgi joylashuvni olish" (GPS) tugma
  saqlandi. Doira "Yetkazib berish" bo'limidagi **Radius (km)** bilan bog'langan.

## O'zgargan/yangi fayllar

| Fayl | O'zgarish |
| --- | --- |
| `server/src/geo/geo.ts` | `DEFAULT/MAX_FOOD_RADIUS_KM`, `effectiveFoodRadiusKm()` |
| `server/src/public/products/public-products.service.ts` | `list()` per-store radius gate; `getBySlug()` helperga o'tdi |
| `server/src/public/stores/public-stores.service.ts` | `nearby()` per-store radius gate |
| `seller/src/features/store/LocationPicker.tsx` | yangi — Leaflet map picker |
| `seller/src/features/store/StoreForm.tsx` | map integratsiyasi (dynamic, ssr:false) |
| `seller/package.json` | `leaflet`, `@types/leaflet` |

## Tekshirildi

- `server`: `tsc --noEmit` ✅, `nest build` ✅
- `seller`: `tsc --noEmit` ✅, `next build` ✅ (`/dashboard/store` static prerender —
  ssr:false map SSR'ni buzmaydi), `LocationPicker` eslint toza.

## Cheklovlar / keyingi qadam

- Xarita kutubxonasi **Leaflet + OSM** (bepul, kalitsiz). Kerak bo'lsa keyin
  Yandex Maps (UZ uchun aniqroq tiles) ga almashtirilishi mumkin — API kalit bilan.
- Browse gate **mijoz tanlagan manzil geo'si** `/v1/products` ga uzatilganda
  ko'rinadi. FOOD kategoriya sahifasi bunisiz allaqachon "manzil tanlang" bo'sh
  holatini ko'rsatadi, shuning uchun real oqimda gate kuchga kiradi.
- `nearby()` hozircha hech bir panel tomonidan chaqirilmaydi (kelajak uchun
  tayyor turibdi).
- Masofa — haversine (to'g'ri chiziq), real yo'l masofasi emas (MVP uchun yetarli).
