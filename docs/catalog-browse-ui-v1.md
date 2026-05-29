# Mini App — Catalog browse UI (2026-05-28)

Backend public catalog API'siga UI qatlami. Xaridor endi:
- Kategoriya tree'ni ko'radi (dinamik, admin yaratgan)
- Kategoriya ichida mahsulot grid'ini ko'rib chiqadi
- Mahsulot detal sahifasida variant + sotuvchi tanlaydi
- Savatga qo'shadi (cart-orders-ui-v1 bilan to'liq oqim)

**Tegishli TZ:** §20.1 Bosh sahifa · §20.2 Kategoriya · §20.3 Sotuvchi sahifasi.

## Yangi sahifalar

| Route | Maqsad |
| --- | --- |
| `/catalog` | Kategoriyalar tree, FOOD/MARKETPLACE bo'limlari, qidiruv chizig'i |
| `/c/[slug]` | Kategoriya ichi — sub-categories chips, sort tabs, mahsulot grid, pagination |
| `/p/[slug]` | Mahsulot detali — galereya, variant, offers, savatga qo'shish |

## Tuzilishi

```
client/src/
├── features/catalog/
│   ├── types.ts          # CategoryNode, ListedProduct, ProductDetail, ...
│   ├── api.ts            # categoriesTree, categoryBySlug, products, productBySlug
│   ├── hooks.ts          # useCategoriesTree, useCategory, useProducts, useProduct
│   └── ProductCard.tsx   # grid card komponenti
└── app/(panel)/
    ├── catalog/page.tsx  # qayta yozildi (placeholder o'rniga)
    ├── c/[slug]/page.tsx # YANGI
    └── p/[slug]/page.tsx # YANGI
```

## Backend bilan ulanish

Public endpoint'lar (auth talab qilmaydi):
- `GET /api/v1/categories/tree`
- `GET /api/v1/categories/:slug`
- `GET /api/v1/products?categorySlug=&sort=&page=&pageSize=&lat=&lng=`
- `GET /api/v1/products/:slug?lat=&lng=`

## UX yechimlar

### 1. FOOD vs MARKETPLACE

FOOD kategoriya'lar geo (lat/lng) talab qiladi — bo'lmasa backend 400. Bu
slice'da geo-picker yo'q, shuning uchun FOOD kategoriyaga kirsangiz
"Manzil tanlanmagan" empty state → `/addresses` ga link ko'rsatadi.

MARKETPLACE kategoriya'larda geo yo'q ham ishlaydi — sotuvchi masofalari
ko'rinmaydi, lekin mahsulotlar ro'yxati to'liq chiqadi.

**Keyingi slice:** address-store qo'shish (cart-orders-ui-v1'da addresses
bor — uni "joriy manzil" state qilish kerak).

### 2. Sotuvchi tanlash (per offer)

Backend mahsulot detalida har variant uchun **barcha offer'larni**
qaytaradi (price ascending). UI ularni card sifatida ko'rsatadi: tanlash
mumkin — `selectedOfferId` checkout'da ishlatiladi.

`outOfRange` flag (FOOD radius tashqarisi) — offer card disable bo'ladi,
"Radius tashqarisi" badge.

### 3. Galereya

Bosh rasm aspect-square. Pastida thumbnail strip horizontal scroll bilan.
Tap → rasm o'zgaradi.

### 4. Spec table

`product.attributeValues` (FOOD: calories, ingredients; non-food: RAM, color,
…) — `<dl>` jadval ko'rinishida. Backend `category_attributes` orqali har
kategoriya o'zining maxsus field'lariga ega bo'la oladi (TZ §22 dynamic
attribute system).

### 5. Sticky add-to-cart

Bottom action bar `sticky bottom-16` (BottomNav 16h) — har doim ekranda.
Qty +/- bilan stock max'i `disabled`. Tugma narxni real-time hisoblaydi
(`price × qty`).

Muvaffaqiyatli qo'shilganda — yashil success banner + "Savatni ochish" linki.
Xato bo'lsa — qizil banner (stock yetmagani, store yopilgani va h.k.).

### 6. Sub-categories chips

`/c/[slug]` ochilganda — agar bu sub-category'lari bo'lsa, horizontal
scroll chip ro'yxati ko'rinadi. "Ovqat" → "Lavash | Burger | Pizza | Osh".

### 7. Sort

4 ta variant: Reyting / Yangi / Arzon / Qimmat. Backend `rating_desc`,
`newest`, `price_asc`, `price_desc`, `distance_asc` (geo bilan) qabul
qiladi. UI'da `distance_asc` hozircha yo'q (geo-picker keyingi sprint).

### 8. Pagination

Sahifa 24 ta mahsulot. Pagination kompakt — "← Oldingi · 1 / 5 · Keyingi →".

## Reusable komponentlar

- **`ProductCard`** (`features/catalog/ProductCard.tsx`) — grid card. Best
  offer narx + sotuvchi nom + masofa. `/catalog`, `/c/[slug]`, kelajakda
  `/home`'da "Tavsiyalar" sectionda ham ishlatiladi.

## Tekshirildi

- `npx tsc --noEmit` (client) — toza
- Visual: keyingi sprint'da (RAM tejash uchun)

## Cheklov + keyingi sprint

- **Geo-picker UI yo'q** — FOOD kategoriya'lar empty state'ga tushadi. Qo'shish:
  zustand `useLocationStore` — manzil saqlanadi, butun ilovada ishlatiladi.
- **Search ishlamaydi** — qidiruv chizig'i bor lekin endpoint endi yo'q
  (backend'da `/v1/search` yo'q, faqat `q=` query parameter). Alohida slice.
- **`/store/[slug]` yo'q** — TZ §20.3 sotuvchi sahifasi (do'kon profili)
  hali yo'q. Keyingi qadam.
- **Wishlist tugmasi yo'q** — backend ham yo'q. Alohida feature.
- **Variant + offer combined sort yo'q** — variant tanlanganda offer'lar
  price ascending, bu yetarli MVP uchun.
- **Realtime stock yangilanishi yo'q** — boshqa xaridor sotib olsa, sahifa
  reload'gacha eski stock ko'rinadi.

## Order full-loop yopildi 🎉

Bu slice bilan **MVP order oqimi to'liq tayyor**:

```
/catalog → /c/[slug] → /p/[slug] → "savatga qo'sh"
       ↓
   /cart (qty edit, do'kon guruhi)
       ↓
  /checkout (manzil + COD tasdiqlash)
       ↓
   /orders (paginated, status filter)
       ↓
  /orders/[id] (status timeline)
                ↑
   Sotuvchi: /dashboard/orders → status transitions
```

MVP'ning eng katta funksional oqimi yopildi. Endi qolgan'lar: seed data,
Telegram bot xabarlari, search, Yandex Maps picker.
