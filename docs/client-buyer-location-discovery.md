# Client — xaridor lokatsiyasi va kashfiyot zanjiri (W1)

## Muammo

Xaridor amalda **buyurtma bera olmasdi**. Sabab checkout/order kodida emas (u sog'lom) —
undan oldingi **kashfiyot zanjiri uzilgan** edi:

1. **FOOD kategoriyasi geo'siz qattiq bloklangan.** `c/[slug]/page.tsx` da
   `enabled = cat.type !== "FOOD"` — ovqat hech qachon yuklanmasdi. Backend FOOD uchun
   `lat/lng` majburiy qiladi, lekin client hech qachon lokatsiya bermasdi. MVP esa
   faqat ovqat → mahsulot ko'rinmaydi → savat bo'sh → checkout bloklanadi.
2. **Bosh sahifa kategoriya plitkalari 404.** `/catalog/{slug}` ga link qilardi
   (bunday route yo'q); to'g'risi `/c/{slug}`. Ustiga slug'lar statik va xayoliy edi
   (`food`/`grocery`/...), seeddagi real slug'larga mos kelmasdi.
3. **`/v1/stores/nearby` hech qachon chaqirilmasdi** — "menga yetkaza oladigan
   sotuvchilar" funksiyasi ishlamasdi (placeholder turardi).
4. Checkout xato yutilib qolardi (network/CORS xatosi "Buyurtma yaratilmadi" deb
   ko'rinardi).

## Yechim (faqat frontend, backend o'zgarmagan)

### Aktiv lokatsiya manbai
- `features/location/store.ts` — persisted zustand store (`bee-client-location`),
  `auth` store patterniga mos. `{ lat, lng, label, addressId }`.
- `features/location/hooks.ts`:
  - `useEnsureLocation()` — default manzildan (yoki birinchisidan) lokatsiyani urug'lantiradi.
    `AppShell` da bir marta chaqiriladi; navigatsiyada (pathname) qayta tekshiradi, lekin
    lokatsiya o'rnatilgach qayta fetch qilmaydi.
  - `useActiveLocation()` — sahifalar uchun read-only accessor.

### Kashfiyot sahifalari geo oladi
- `c/[slug]/page.tsx` — `enabled = cat.type !== "FOOD" || Boolean(geo)`; lokatsiya bo'lsa
  FOOD ham yuklanadi, query'ga `lat/lng` qo'shiladi. Lokatsiya yo'q FOOD'da "Manzil
  tanlanmagan" prompt qoladi.
- `p/[slug]/page.tsx` — `useProduct(slug, geo)`: offerlar radius bo'yicha filtrlanadi va
  yetkazish narxi ko'rinadi (avvalgi TODO bartaraf etildi).

### Bosh sahifa
- Kategoriya plitkalari `useCategoriesTree()` dan (real slug'lar), `/c/${slug}` ga link.
  `IconTile` ga ixtiyoriy `imageUrl` qo'shildi (kategoriya `iconUrl`, dizayn buzilmaydi).
- "Yaqin sotuvchilar" bo'limi `useStoresNearby(geo)` orqali real do'konlarni ko'rsatadi
  (logo, masofa, ETA, bazaviy narx). Lokatsiya yo'q bo'lsa "Manzil qo'shing" empty-state.
- Hero'dagi manzil chip + Topbar yorlig'i aktiv lokatsiya nomini ko'rsatadi, `/addresses` ga link.

### Checkout xatosi
- `checkout/page.tsx` — javobsiz (network/CORS) xato endi alohida xabar bilan ko'rsatiladi.

## Yangi/o'zgargan fayllar
- yangi: `client/src/features/location/{store.ts,hooks.ts}`
- `client/src/features/catalog/{api.ts,hooks.ts,types.ts}` — `storesNearby` + `NearbyStore` + `useStoresNearby`
- `client/src/widgets/app-shell/AppShell.tsx` — `useEnsureLocation()`
- `client/src/shared/ui/IconTile.tsx` — `imageUrl` prop
- `client/src/app/(panel)/home/page.tsx`, `c/[slug]/page.tsx`, `p/[slug]/page.tsx`
- `client/src/widgets/topbar/Topbar.tsx`, `client/src/app/(panel)/checkout/page.tsx`

## Tekshiruv
- `tsc --noEmit` — toza (0 xato).
- ESLint — yangi/o'zgargan kod toza. Mavjud `set-state-in-effect` /
  `no-unescaped-entities` xatolar pre-existing (HEAD'da ham bor), bu ishda tegilmagan.

## Keyinga qoldirildi (ixtiyoriy)
- Catalog qidiruv inputi hali dekorativ (`q` backend'da bor; W1.6).
- Xarita orqali manzil tanlash (hozir default manzildan/GPS dan).
- Do'kon (seller) sahifasi — nearby kartalar hozircha navigatsiyasiz (TZ §20.3).
