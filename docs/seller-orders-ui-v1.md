# Sotuvchi paneli — Buyurtmalar UI (2026-05-28)

Backend [cart-orders-v1](./cart-orders-v1.md) ga sotuvchi tarafi UI. Sotuvchi
endi do'koniga kelgan buyurtmalarni ko'ra, qabul/rad eta va status'larni
yangilab boradi.

**Tegishli TZ:** §19.3 — Sotuvchi paneli "Buyurtmalar" bo'limi.

## Yangi sahifalar

| Route | Maqsad |
| --- | --- |
| `/dashboard/orders` | Do'konga kelgan buyurtmalar ro'yxati, status filter chips, pagination |
| `/dashboard/orders/[id]` | Buyurtma detali — xaridor, manzil, tarkib, total, status timeline, transition tugmalari |

Sidebar nav'da link allaqachon bor edi (`shared/config/nav.ts`) — sahifalar yaratilgach link avtomatik ishlay boshlaydi.

## Tuzilishi

```
seller/src/
├── features/orders/
│   ├── types.ts        # Order, OrderStatus, Paginated<T>
│   ├── status.ts       # ORDER_STATUS_META + SELLER_TRANSITIONS
│   ├── api.ts          # sellerOrdersApi: list, get, updateStatus
│   └── hooks.ts        # useSellerOrders, useSellerOrder
├── shared/lib/
│   └── format.ts       # formatSum, formatDateTime, formatPhone (YANGI)
└── app/dashboard/orders/
    ├── page.tsx        # ro'yxat
    └── [id]/page.tsx   # detail + actions
```

## Status state machine (FE side)

`SELLER_TRANSITIONS` server'ning `SELLER_TRANSITIONS` mapping'iga **aniq mos
keladi** (`server/src/orders/orders.service.ts`). Backend agar UI noto'g'ri
holatga o'tmoqchi bo'lsa 400 qaytaradi — UI bu yerda himoyaga ishonadi.

```
PENDING   → ACCEPTED | REJECTED
ACCEPTED  → PREPARING | CANCELLED
PREPARING → READY | CANCELLED
READY     → ON_WAY | CANCELLED
ON_WAY    → DELIVERED
DELIVERED → (terminal)
```

Har status uchun action label:

| Target | Label (UI) | Variant |
| --- | --- | --- |
| ACCEPTED | Qabul qilish | primary |
| REJECTED | Rad etish | outline (danger) — sabab so'raydi |
| PREPARING | Tayyorlashni boshlash | primary |
| READY | Tayyor | primary |
| ON_WAY | Kuryerga berildi | primary |
| DELIVERED | Yetkazildi | primary |
| CANCELLED | Bekor qilish | outline (danger) — sabab so'raydi |

`REJECTED`/`CANCELLED` tanlanganda `prompt()` orqali sotuvchi sabab kiritadi
— backend `transitionStatus` orqali `rejectionReason` field'iga yoziladi.

## UX yechimlar

### 1. Tarkib + xulosa kompakt joylashuv

Detail sahifa `grid-cols-1 lg:grid-cols-2` bilan ikki ustun:
- **Chap**: xaridor + manzil + xaridor eslatmasi
- **O'ng**: tarkib + jami + status timeline

Mobile'da ikkalasi bir ustunda, scrollable.

### 2. Yandex Maps deeplink

Manzil card'da "Xaritada" linki:
```
https://yandex.uz/maps/?ll=<lng>,<lat>&z=17&pt=<lng>,<lat>
```
Sotuvchi bir tasldan kuryerga lokatsiyani ko'rsata oladi.

### 3. Telefon "Qo'ng'iroq" tugmasi

`tel:+998XXX` link — mobile'da darhol qo'ng'iroq ochiladi. Sotuvchi telefon
nomeri masklangan emas (TZ §16 masked call v2'da; v1'da ochiq).

### 4. Tabular numbers

Barcha narx/raqam ko'rinishlari `tabular-nums` class bilan — Inter shrifti
bu OpenType feature'ni qo'llab-quvvatlaydi, raqamlar tahriri payt ham
shtampovka ko'rinishida turadi.

### 5. Tugma block

`pending` state bir vaqtning o'zida faqat bitta transition'ni qo'lloydi —
boshqa tugmalar `disabled`. Spinner faqat bosilgan tugmada.

## Tekshirildi

- `npx tsc --noEmit` — toza
- Status filter chips horizontal scroll mobile'da, desktop'da flex-wrap
- Sidebar `/dashboard/orders` link allaqachon mavjud edi — kutilmagan dead link yo'q

## Cheklov + keyingi sprint

- **Realtime push yo'q** — yangi buyurtma kelganida sahifa avtomatik
  yangilanmaydi. Sotuvchi reload qilishi kerak. Socket.IO `order.created`
  event keyingi sprint.
- **Telegram bot xabar yo'q** — sotuvchi yangi buyurtma kelganini bot orqali
  bilmaydi. Bot worker order queue qo'shilgach ishlaydi.
- **Stats / breakdown yo'q** — kunlik tushum, top mahsulot statistikasi
  alohida (TZ §19.5).
- **Buyurtmadan qaytma (refund) yo'q** — to'lov tizimi v2'da (Click/Payme).

## Keyingi qadam (TZ tartibi bo'yicha)

Endi sotuvchi buyurtma qabul qila oladi → **Mini App catalog browse UI**
(TZ §20.2) — xaridor mahsulotni ko'rishi, savatga qo'shishi mumkin bo'ladi.
Bu MVP'ning **eng oxirgi katta gap**'i (food order full-loop yopiladi).
