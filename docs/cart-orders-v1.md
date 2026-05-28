# Cart & Orders v1 — backend modules (2026-05-28)

Mavjud catalog/marketplace tizimini saqlagan holda **savat → buyurtma**
hayot siklini quvvatlaydigan to'rt yangi backend moduli qo'shildi. Frontend
(Mini App, Sotuvchi paneli) bu API'ni keyingi sprint'da iste'mol qiladi.

## Maqsad

- Foydalanuvchi savatga mahsulot qo'sha oladi (turli sotuvchilardan).
- Checkout vaqtida savat **sotuvchi bo'yicha bo'linadi** — har sotuvchi
  o'zining alohida buyurtmasini oladi.
- Yetkazib berish narxi `Store` koordinatasi va xaridor `Address`
  koordinatasi orasidagi masofa bo'yicha **avtomatik hisoblanadi**
  (haversine + bounding-box, MariaDB-friendly).
- FOOD kategoriya uchun radius cheklovi: agar manzil `deliveryRadiusKm` dan
  uzoq bo'lsa — buyurtma yaratilmaydi.
- Buyurtma status hayot sikli: PENDING → ACCEPTED → PREPARING → READY →
  ON_WAY → DELIVERED. CANCELLED/REJECTED — terminal.
- Sotuvchi o'z buyurtmalarini ko'ra oladi, statusni o'zgartira oladi.
- Bekor qilingan buyurtma stock'ni avtomatik tiklaydi.

## Yangi server tuzilishi

```
server/src/
├── common/
│   ├── pagination.ts            # { data, meta: { page, limit, total, totalPages } }
│   └── pagination-query.dto.ts  # ?page=&limit= validatsiya
├── addresses/
│   ├── addresses.controller.ts  # /api/addresses CRUD
│   ├── addresses.service.ts     # auto-default promotion, ownership checks
│   └── addresses.module.ts
├── cart/
│   ├── cart.controller.ts       # /api/cart [items]
│   ├── cart.service.ts          # upsert items, store-grouped serialize
│   └── cart.module.ts
├── orders/
│   ├── orders.controller.ts     # /api/orders [checkout, list, cancel]
│   ├── orders.service.ts        # split-by-store checkout, status state machine
│   ├── order.serializer.ts      # ORDER_INCLUDE + serialize
│   ├── dto/{checkout,list-orders-query,update-status}.dto.ts
│   └── orders.module.ts
└── seller/orders/
    ├── seller-orders.controller.ts  # /api/seller/orders [list, detail, status]
    └── seller-orders.module.ts
```

## Schema migration: `20260528080003_add_cart_orders_v1`

Yangi modellar (`server/prisma/schema.prisma`):

```prisma
model Address {
  id        String  @id @default(cuid())
  userId    String
  label     String  // "Uy", "Ish"
  fullText  String  @db.Text
  latitude  Decimal @db.Decimal(10, 7)
  longitude Decimal @db.Decimal(10, 7)
  notes     String? @db.Text
  isDefault Boolean @default(false)
  @@index([userId, isDefault])
}

model Cart {
  id     String     @id @default(cuid())
  userId String     @unique
  items  CartItem[]
}

model CartItem {
  cartId        String
  offerId       String
  qty           Int
  priceSnapshot Decimal @db.Decimal(12, 2)
  @@unique([cartId, offerId])
}

enum OrderStatus {
  PENDING ACCEPTED PREPARING READY ON_WAY DELIVERED CANCELLED REJECTED
}

enum PaymentMethod { COD }

model Order {
  orderNumber     String      @unique // "BEE-260528-12345A"
  userId          String
  storeId         String
  addressId       String?
  status          OrderStatus @default(PENDING)
  paymentMethod   PaymentMethod @default(COD)
  subtotal        Decimal     @db.Decimal(12, 2)
  deliveryFee     Decimal     @db.Decimal(12, 2)
  total           Decimal     @db.Decimal(12, 2)
  distanceKm      Decimal?    @db.Decimal(6, 2)
  addressSnapshot Json?
  customerName    String?
  customerPhone   BigInt
  notes           String?     @db.Text
  acceptedAt      DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  @@index([userId, createdAt])
  @@index([storeId, status, createdAt])
}

model OrderItem {
  orderId      String
  offerId      String?     // nullable — offer may be deleted
  productTitle String      // snapshot
  variantTitle String?     // snapshot
  imageUrl     String?     // snapshot
  price        Decimal
  qty          Int
  subtotal     Decimal
}

model OrderStatusHistory {
  orderId   String
  status    OrderStatus
  changedBy String?     // userId / sellerId / null = system
  note      String?
}
```

## API kontrakti

### Customer (`Bearer` token + `type=user`)

| Method | Path | Tavsif |
| --- | --- | --- |
| GET | `/api/cart` | Savatni do'kon bo'yicha guruhlangan holda olish |
| POST | `/api/cart/items` | `{ offerId, qty }` — qo'shish yoki increment |
| PATCH | `/api/cart/items/:id` | `{ qty }` — set (qty=0 emas, DELETE ishlating) |
| DELETE | `/api/cart/items/:id` | Item o'chirish |
| DELETE | `/api/cart` | Butun savatni tozalash |
| GET | `/api/addresses` | Manzillar ro'yxati (default — birinchi) |
| POST | `/api/addresses` | Yangi manzil — ilk manzil avtomatik default |
| PATCH | `/api/addresses/:id` | Tahrirlash; `isDefault: true` — promote |
| DELETE | `/api/addresses/:id` | O'chirish; default bo'lsa — keyingisi promote |
| POST | `/api/orders/checkout` | `{ addressId, paymentMethod?, notes? }` |
| GET | `/api/orders?page=&limit=&status=` | Mening buyurtmalarim |
| GET | `/api/orders/:id` | Buyurtma detali (history bilan) |
| POST | `/api/orders/:id/cancel` | `{ reason? }` — faqat PENDING |

### Seller (`@Roles('seller')`)

| Method | Path | Tavsif |
| --- | --- | --- |
| GET | `/api/seller/orders?page=&limit=&status=` | Do'konga kelgan buyurtmalar |
| GET | `/api/seller/orders/:id` | Buyurtma detali |
| PATCH | `/api/seller/orders/:id/status` | `{ status, note? }` — transition matritsasi |

### Pagination envelope

Barcha list endpoint'lari shu shaklda javob qaytaradi:

```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 137, "totalPages": 7 }
}
```

`limit` cheki **100**, default **20**.

## Checkout oqimi (eng muhim qism)

1. **Address yuklash** — `addresses.getOwnedOrThrow` orqali ownership tekshiruvi.
2. **Cart yuklash** — barcha item'lar, offer, store, variant, product, image
   bitta query'da.
3. **Pre-validation** (DB'ga tegmasdan):
   - Har store `status === 'ACTIVE'` va `isOpen === true`.
   - Har offer `isActive` va `stock >= qty`.
4. **Store bo'yicha guruh** — `Map<storeId, items[]>`.
5. **Har guruh uchun**:
   - Distance = `haversineKm(address, store)`.
   - FOOD kategoriya: agar `distance > deliveryRadiusKm` — 400.
   - `deliveryFee = computeDeliveryFee(distance, storeOverride, categoryDefault)`.
   - `subtotal = Σ price × qty`, `total = subtotal + deliveryFee`.
6. **Transaction** ichida:
   - `Order` create + `OrderItem` create (snapshot bilan).
   - `OrderStatusHistory` PENDING qator.
   - `SellerOffer.stock` decrement; `stock <= 0` bo'lsa `isActive = false`.
   - `CartItem.deleteMany` — savat bo'shaydi.
7. **Hydrate + return** — yaratilgan har buyurtma to'liq shaklda qaytadi.

## Status state machine

```
PENDING   → ACCEPTED | REJECTED | CANCELLED   (PENDING'dan customer ham cancel qila oladi)
ACCEPTED  → PREPARING | CANCELLED
PREPARING → READY | CANCELLED
READY     → ON_WAY | CANCELLED
ON_WAY    → DELIVERED
DELIVERED → (terminal)
CANCELLED → (terminal)
REJECTED  → (terminal)
```

**Stock tiklash:** CANCELLED yoki REJECTED ga o'tganda har `OrderItem.offerId` (mavjud bo'lsa) uchun `stock += qty` va `isActive = true` bajariladi — yagona tranzaksiyada.

**Timestamp'lar:** ACCEPTED → `acceptedAt`; DELIVERED → `deliveredAt`; CANCELLED/REJECTED → `cancelledAt` + ixtiyoriy `rejectionReason`.

## Snapshot strategiyasi

Buyurtma yaratilganda quyidagi ma'lumotlar **`OrderItem` / `Order`ga
ko'chiriladi** — mahsulot keyinroq o'zgarsa ham buyurtma o'qiladi:

- `productTitle`, `variantTitle`, `imageUrl` (item bo'yicha)
- `price` (per-unit)
- `customerName`, `customerPhone` (Order bo'yicha)
- `addressSnapshot` JSON: `{ label, fullText, latitude, longitude, notes }`

`offerId`/`addressId` — nullable FK (offer/address keyinchalik o'chirilgan bo'lsa, snapshot saqlanadi).

## Order number format

`BEE-YYMMDD-XXXXX[A]` — masalan `BEE-260528-08003N`.

- `YYMMDD` — yaratilgan kun.
- `XXXXX` — `now.getTime() % 100000` (zero-padded).
- `A` — random base36 nibble (16 ta variant).

DB tomonida `@unique` — collision bo'lsa Prisma `P2002` qaytaradi. Amaliyotda
real to'qnashuv ehtimoli minimal.

## Pagination utility

`server/src/common/pagination.ts`:

```ts
parsePagination({ page, limit }) → { page, limit, skip, take }
paginated(items, total, page, limit) → { data, meta: {...} }
```

Boshqa modulilar (`reviews`, `notifications`, …) ham asta-sekin shu shakka ko'chiriladi (alohida tozalash task).

## Telegram bot integratsiyasi (keyingi sprint)

Hozir bot xabarlari **yo'q** — `OrdersService.transitionStatus` ichida
TODO sifatida qoldi. Keyingi qadam:

1. Notification queue'ga `order.status.changed` event yuborish.
2. Bot worker xaridor `telegramId` ga `BEE-260528-XXXXX buyurtmangiz ACCEPTED bo'ldi` xabarini yuboradi.
3. Mini App `Socket.IO` orqali realtime update oladi.

## Test qilish (manual smoke)

```bash
# 1. Address yarat
curl -X POST http://localhost:4000/api/addresses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"label":"Uy","fullText":"Mirobod 12, 45-uy","latitude":41.31,"longitude":69.27}'

# 2. Cart'ga item qo'sh
curl -X POST http://localhost:4000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"offerId":"<OFFER_ID>","qty":2}'

# 3. Checkout
curl -X POST http://localhost:4000/api/orders/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"addressId":"<ADDRESS_ID>"}'

# 4. Seller buyurtmani ACCEPT qiladi (seller token bilan)
curl -X PATCH http://localhost:4000/api/seller/orders/<ID>/status \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACCEPTED"}'
```

## Qanday tekshirildi

- `npx prisma validate` — schema toza.
- `npx prisma migrate dev --name add_cart_orders_v1` — DB ga qo'llanildi.
- `npx tsc --noEmit` — 0 ta xato.
- `npx nest build` — muvaffaqiyatli.

## Keyingi qadamlar

1. **Mini App UI** — savat, manzil tanlash, checkout, mening buyurtmalarim
   (client panel).
2. **Sotuvchi paneli UI** — `/dashboard/orders` — kelgan buyurtmalar
   ro'yxati + status tugmalari.
3. **Telegram bot xabarlari** — status o'zgarganda push.
4. **Realtime** — `notifications` Socket.IO orqali order events.
5. **Reviews orderId verification** — `reviews.service.ts` da TODO bor:
   endi `orderId` mavjud, DELIVERED buyurtma'dan keyin `verified: true` qo'yiladi.
6. **Seeders** — fake o'zbek orders/cart items (alohida task).
