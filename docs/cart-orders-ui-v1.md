# Mini App — Cart + Checkout + Orders UI (2026-05-28)

Backend [cart-orders-v1](./cart-orders-v1.md) ga UI qatlami. Xaridor endi
Mini App'da to'liq buyurtma oqimini bajara oladi: savatga qo'shish → manzil
tanlash → tasdiqlash → kuzatish → bekor qilish.

**Tegishli TZ bo'limlari:** §20.4 Savat · §20.5 Buyurtma berish · §20.6
Mening buyurtmalarim · §20.7 Profil (manzillar).

## Sahifalar

| Route | Maqsad |
| --- | --- |
| `/cart` | Savat — do'kon bo'yicha guruhlangan item'lar, qty +/-, narx |
| `/checkout` | Buyurtma berish — manzil tanlash, xulosa, to'lov tasdiqlash |
| `/orders` | Mening buyurtmalarim — paginated ro'yxat, status filter chips |
| `/orders/[id]` | Buyurtma detali — tarkib, manzil snapshot, status tarixi, cancel |
| `/addresses` | Manzillar kitobi — yaratish, tahrirlash, asosiy belgilash, o'chirish |

`/profile` ham yangilandi: "Saqlangan manzillar" tugmasi `/addresses` ga
linklandi.

## Yangi tuzilishi

```
client/src/
├── features/
│   ├── addresses/
│   │   ├── api.ts                # axios wrapper: list/create/update/remove
│   │   ├── hooks.ts              # useAddresses
│   │   ├── types.ts              # Address, CreateAddressDto
│   │   └── AddressForm.tsx       # qo'shish/tahrirlash forma + geolokatsiya
│   ├── cart/
│   │   ├── api.ts                # /cart endpointlari
│   │   ├── store.ts              # zustand — global cart state (badge uchun)
│   │   └── types.ts              # Cart, CartItem, CartStoreGroup
│   └── orders/
│       ├── api.ts                # checkout/list/get/cancel
│       ├── hooks.ts              # useOrders, useOrder
│       ├── status.ts             # ORDER_STATUS_META + label mapping
│       └── types.ts              # Order, OrderStatus, Paginated<T>
├── app/(panel)/
│   ├── cart/page.tsx             # qayta yozildi (placeholder o'rniga)
│   ├── checkout/page.tsx         # YANGI
│   ├── orders/page.tsx           # qayta yozildi
│   ├── orders/[id]/page.tsx      # YANGI
│   └── addresses/page.tsx        # YANGI
└── widgets/mobile-shell/
    └── MobileShell.tsx           # cart badge avtomatik yangilanadi
```

## State management

**Cart** — global `zustand` store (`features/cart/store.ts`). Sabab: cart
itemCount badge `Topbar`'da har sahifada ko'rinishi kerak, va `/checkout`
sahifa ham cart ma'lumotini o'qiydi.

**Orders + Addresses** — komponent-darajadagi `useState` + `useEffect`
hook'lari (`useOrders`, `useOrder`, `useAddresses`). Stale-while-revalidate
yo'q; har sahifa mount'da `reload()` chaqiriladi. TanStack Query keyingi
sprint'da qo'shilishi mumkin agar revalidation nuance kerak bo'lsa.

## Asosiy oqim

```
catalog
  └─→ add to cart
            ↓
        /cart  (qty edit, remove, narx o'zgardi prompt)
            ↓
       Buyurtma berish tugmasi
            ↓
        /checkout
          ├── manzil tanlash (asosiy auto-selected)
          ├── inline yangi manzil yaratish (agar yo'q bo'lsa)
          ├── tarkib xulosasi (qty edit yo'q bu yerda)
          ├── eslatma (ixtiyoriy)
          └── To'lov: Naqd (COD)
                ↓
         Tasdiqlash → POST /orders/checkout
                ↓
        /orders (yangi buyurtma boshida)
                ↓
        /orders/[id] (status timeline + cancel agar PENDING)
```

## Asosiy UX yechimlar

### 1. Cart "narx o'zgardi" warning

Backend `CartItem.priceSnapshot != offer.price` ni aniqlasa, item'ga
`priceChanged: true` + `livePrice` qaytaradi. UI'da sariq warning ko'rsatadi
(`AlertTriangle` ikon + "Narx o'zgardi: X so'm"). Foydalanuvchi qty edit
qilganda `priceSnapshot` avtomatik live narxga yangilanadi.

### 2. Empty checkout — inline address create

Yangi xaridor cart to'ldirdi → `/checkout` ochdi → manzil yo'q. O'rniga
`/addresses` ga yo'naltirish o'rniga **shu sahifaga `AddressForm`'ni
inline render qilamiz**. Birinchi manzil yaratilgach, avtomatik tanlanib,
foydalanuvchi tasdiqlay oladi.

### 3. Cart badge

`Topbar` `cartCount` prop oladi. `MobileShell` `useCartStore`'dan o'qib
o'tkazadi. Login bo'lganda bir marta `fetch()` chaqiriladi —
keyin `addItem/updateQty/removeItem` har biri yangi cart bilan store'ni
yangilaydi, badge avtomatik ko'rinadi.

### 4. Geolokatsiya

`AddressForm` `navigator.geolocation` orqali "Hozirgi joylashuvni olish"
tugmasi taklif qiladi. Telegram Mini App ichida ham ishlaydi (WebApp
geolocation API'siga ruxsat beradi). Manual lat/lng kirish ham bor.

Yandex Maps / OSM map picker — keyingi sprint (alohida task).

### 5. Order status state machine

`features/orders/status.ts` — har 8 ta status uchun `label` + Badge `tone`:

| Status | Label | Tone |
| --- | --- | --- |
| PENDING | Kutilmoqda | info |
| ACCEPTED | Qabul qilindi | brand |
| PREPARING | Tayyorlanyapti | brand |
| READY | Tayyor | brand |
| ON_WAY | Yo'lda | brand |
| DELIVERED | Yetkazildi | success |
| CANCELLED | Bekor qilindi | danger |
| REJECTED | Rad etildi | danger |

`/orders` sahifa filter chip'lari shu ro'yxatni horizontal scroll qiladi.

### 6. Cancel UI

`/orders/[id]` sahifa `status === 'PENDING'` bo'lsa "Buyurtmani bekor
qilish" tugmasi ko'rsatadi. Backend `transitionStatus` cancel uchun
PENDING'dan tashqari 400 qaytaradi — UI bu yerda himoyaga ishonchi
yetadi.

## Tekshirildi

- `npx tsc --noEmit` — 0 ta xato
- `npm run build` — muvaffaqiyatli, 11 ta route compiled
- **Playwright UI test (8 sahifa × 3 viewport):**
  - 0 nav errors, 0 console errors, 0 overflow
- **Visual populated test** (`.ui-test/seed-and-shot.js`):
  - Cart 3 ta item bilan badge 3 ko'rsatadi, do'kon guruhi ishlaydi
  - Checkout asosiy manzil auto-selected, tarkib xulosasi to'g'ri
  - Orders list 2 ta buyurtma (PENDING + DELIVERED) status badge'lari mos
  - Order detail status timeline 6 qator (PENDING → DELIVERED) chiroyli ko'rinadi
  - Addresses populated state asosiy manzil "Asosiy" badge bilan

Screenshot'lar `.ui-test/shots/populated_*.png` (gitignored).

## Cheklov va keyingi sprint

- **Map picker yo'q** — manzil koordinatalari manual yoki GPS. Yandex
  Maps SDK keyingi sprint.
- **Catalog → cart bog'lanish yo'q** — `/catalog` sahifa hali placeholder.
  Mahsulot detali sahifa yo'q. Bu keyingi slice (Mini App browse UI).
- **Realtime status update yo'q** — buyurtma status o'zgarganda hozirgi
  UI manual `reload()` bilan yangilanadi. Socket.IO order events qo'shilsa
  avtomatik bo'ladi.
- **Reviews bog'lanmagan** — DELIVERED buyurtma'dan keyin "Baholash"
  CTA yo'q. Backend `reviews.service.ts` da `orderId` verification TODO
  hali ham bor.
- **Telegram bot xabarlari** — status o'zgarganda Telegram'ga push
  hozircha yuborilmaydi.

## Reproduce qilish

```bash
# Backend + client dev
cd server && node dist/main.js   # PORT=60000
cd client && npm run dev          # 60002

# UI smoke
cd .ui-test && node run.js        # 8 sahifa empty state'lar

# Populated visual demo
cd .ui-test && node seed-and-shot.js  # cart + orders + addresses real data
```
