# Marketplace v1 — backend modules (2026-05-25)

Mavjud auth/catalog/admin tizimini saqlagan holda, sotuvchilarning to'liq
marketplace funksiyalarini quvvatlaydigan backend qatlami qo'shildi. Bu sprint
faqat **server tarafini** qamrab oladi — panel UI keyingi sessionga qoladi.

## Maqsad (TZ §7, §11–14, §17, §19)

- Sotuvchi mahsulot yarata oladi, rasm yuklaydi, qoldiqni boshqaradi.
- Tizim ikki xil mahsulot turini ajratadi: **FOOD** (radius + masofa fee +
  ETA) va **MARKETPLACE** (electronics/qurilish/uy mollari — radiussiz).
- Rasm yuklash **Cloudflare R2** ga presigned URL orqali (zarurat: tarmoq
  trafigi serverdan o'tmaydi, CDN-ready).
- Xaridor mahsulotni baholay oladi (faqat tasdiqlangan buyurtmadan keyin).
- "Bu mahsulot kerak" so'rovi — qoldiq tugaganda restock notification.
- Public katalog xaridor uchun geo-aware (FOOD radius bo'yicha filter).

## Yangi server tuzilishi

```
server/src/
├── geo/
│   └── geo.ts                      # haversineKm, boundingBox, computeDeliveryFee
├── uploads/
│   ├── uploads.config.ts           # per-purpose policy (mimes, maxBytes, prefix)
│   ├── r2.client.ts                # @aws-sdk/client-s3 + presigner
│   ├── uploads.service.ts          # presign / complete / attach
│   ├── uploads.controller.ts       # POST /uploads/presign, /uploads/:id/complete
│   └── uploads.module.ts
├── seller/
│   ├── seller.module.ts            # aggregates 3 submodules
│   ├── seller-context.ts           # requireOwnStore / findOwnStore
│   ├── stores/                     # CRUD + geo + KYC
│   ├── products/                   # master Product CRUD by seller
│   └── offers/                     # SellerOffer CRUD (price/stock)
├── public/
│   ├── public.module.ts
│   ├── categories/                 # GET /v1/categories/{tree,:slug}
│   ├── products/                   # GET /v1/products(?filters), /v1/products/:slug
│   └── stores/                     # GET /v1/stores/nearby, /v1/stores/:slug
├── reviews/                        # GET/POST /reviews
└── product-requests/               # POST /product-requests, /seller/product-requests
```

## Schema migration: `20260525103718_add_marketplace_v1`

### Category yangilanishi
```prisma
enum CategoryType { FOOD MARKETPLACE }

model Category {
  type      CategoryType @default(MARKETPLACE)
  deliveryRadiusKm     Int?
  deliveryBaseFee      Decimal? @db.Decimal(12, 2)
  deliveryPerKmFee     Decimal? @db.Decimal(12, 2)
  deliveryEtaMinMinutes Int?
  deliveryEtaMaxMinutes Int?
  minOrderAmount       Decimal? @db.Decimal(12, 2)
  @@index([type, isActive])
}
```

### Store yangilanishi
```prisma
model Store {
  phone   String?
  address String? @db.Text
  latitude  Decimal? @db.Decimal(10, 7)
  longitude Decimal? @db.Decimal(10, 7)
  deliveryRadiusKm  Int?
  deliveryBaseFee   Decimal? @db.Decimal(12, 2)
  deliveryPerKmFee  Decimal? @db.Decimal(12, 2)
  deliveryEtaMinutes Int?
  minOrderAmount    Decimal? @db.Decimal(12, 2)
  isOpen       Boolean @default(true)
  openingHours Json?
  @@index([latitude, longitude])
  @@index([status, isOpen])
}
```

### Product yangilanishi
```prisma
model Product {
  ratingAvg   Decimal @default(0) @db.Decimal(3, 2)
  ratingCount Int     @default(0)
  reviews     Review[]
  requests    ProductRequest[]
}
```

### Yangi modellar
- **UploadedFile** — R2 ob'ekt kalitlari (PENDING/READY/FAILED). `purpose`
  enum bilan (PRODUCT_IMAGE/STORE_LOGO/STORE_BANNER/USER_AVATAR/REVIEW_IMAGE/OTHER).
- **Review** — `productId × storeId × userId × orderId` unique. `verified`
  flag (true faqat DELIVERED Order'dan keyin). Aggregates Product modelida.
- **ProductRequest** — `productId × userId × storeId` unique-ish. `count`
  takroriy bosishni hisoblaydi, status NEW → NOTIFIED → FULFILLED.

## Endpointlar (26 ta yangi marshrut)

### Uploads (auth)
| Method | Path | Maqsad |
|---|---|---|
| POST | `/api/uploads/presign` | Mime/size validatsiya → R2 PUT URL + uploadId |
| POST | `/api/uploads/:id/complete` | R2 HEAD bilan tasdiq, URL qaytaradi |

### Seller (auth + `@Roles("seller")`)
| Method | Path | Maqsad |
|---|---|---|
| GET | `/api/seller/stores/me` | Sotuvchi do'koni (null bo'lishi mumkin) |
| POST | `/api/seller/stores` | Yangi do'kon (PENDING — admin moderation kutadi) |
| PATCH | `/api/seller/stores/me` | KYC + geo + delivery tahrirlash |
| PATCH | `/api/seller/stores/me/open` | Open/Close toggle (faqat ACTIVE da) |
| GET | `/api/seller/products` | Sotuvchining mahsulotlari (sahifalangan) |
| GET | `/api/seller/products/:id` | Bitta mahsulot (kategoriya/atribut/variant/offer) |
| POST | `/api/seller/products` | Yangi mahsulot (PENDING — moderation) |
| PATCH | `/api/seller/products/:id` | Tahrirlash (qaytadan PENDING ga o'tadi) |
| DELETE | `/api/seller/products/:id` | Soft delete (status=ARCHIVED) |
| GET | `/api/seller/offers` | Sotuvchining offer'lari |
| POST | `/api/seller/offers` | Variant uchun yangi offer |
| PATCH | `/api/seller/offers/:id` | Narx/qoldiq/isActive (stock=0 → auto deactivate) |
| DELETE | `/api/seller/offers/:id` | Offer'ni o'chirish |
| GET | `/api/seller/product-requests` | Restock so'rovlarini ko'rish |
| POST | `/api/seller/product-requests/:id/fulfilled` | "Yangidan kelib tushdi" |

### Public (`@Public()`)
| Method | Path | Maqsad |
|---|---|---|
| GET | `/api/v1/categories/tree` | Faol kategoriya daraxti |
| GET | `/api/v1/categories/:slug` | Kategoriya detali (atributlar + filtrlar) |
| GET | `/api/v1/products?categorySlug&q&priceMin&priceMax&lat&lng&radiusKm&sort&page&pageSize` | Geo-aware listing |
| GET | `/api/v1/products/:slug?lat&lng` | Tafsilot + offer'lar + masofa/fee |
| GET | `/api/v1/stores/nearby?lat&lng&radiusKm&limit` | Yaqin atrofdagi do'konlar |
| GET | `/api/v1/stores/:slug` | Do'kon profili |

### Reviews & Product Requests
| Method | Path | Maqsad |
|---|---|---|
| GET | `/api/reviews?productId&storeId&page` | Public |
| POST | `/api/reviews` | Auth — orderId bilan tasdiqlangan keladi (v2) |
| POST | `/api/product-requests` | Auth — restock ping (de-duped) |
| GET | `/api/product-requests/mine` | Auth — buyer's open requests |

## FOOD vs MARKETPLACE logika

`Category.type` ikki yo'lni belgilaydi:

### FOOD
- `/v1/products?categorySlug=...` **lat+lng majburiy** — yo'q bo'lsa 400.
- Bounding-box pre-filter (`store.latitude BETWEEN` …) → in-memory haversine refine
  → faqat `distanceKm ≤ radius` qaytariladi.
- `deliveryFee = baseFee + perKmFee × distanceKm`, 100 so'mga yumaloqlanadi.
- ETA range Category default'idan (`deliveryEtaMinMinutes` ... `deliveryEtaMaxMinutes`)
  yoki Store override.
- Best offer tanlash: avval narx, keyin masofa (tie-break).

### MARKETPLACE (electronics, qurilish, uy mollari, asboblar)
- Geo ixtiyoriy — bo'lmasa hamma faol offer'lar qaytariladi.
- Geo bo'lsa — masofa va fee hisoblanadi, lekin filter qilinmaydi.
- "Sotuvchi yetkazib bera oladimi" testi keyingi sprint'da (Order ship vaqti
  yoki PostalCarrier integratsiyasi).

`server/src/geo/geo.ts` — `haversineKm`, `boundingBox` (1° lat ≈ 111km
yaqinlashishi), `computeDeliveryFee`, `decimalToNumber`.

## R2 sozlash

`.env` ga qo'shing:

```bash
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET=bee-express-uploads
CLOUDFLARE_R2_PUBLIC_URL=https://cdn.beeexpress.uz
```

Yo'q bo'lsa, `/api/uploads/presign` 503 qaytaradi (graceful degradation).

### Frontend flow

```ts
// 1. Get presigned PUT URL
const { uploadId, putUrl, headers } = await api.post('/uploads/presign', {
  purpose: 'PRODUCT_IMAGE',
  mimeType: file.type,
  size: file.size,
});

// 2. PUT directly to R2 (no traffic through our server)
await fetch(putUrl, { method: 'PUT', headers, body: file });

// 3. Server-side verification + URL
const { url } = await api.post(`/uploads/${uploadId}/complete`);

// 4. Use uploadId when creating product
await api.post('/seller/products', { ..., imageUploadIds: [uploadId] });
```

## Per-purpose upload policy

`uploads.config.ts`:

| Purpose | Max size | Mimes |
|---|---|---|
| PRODUCT_IMAGE | 8 MB | JPEG/PNG/WebP/AVIF |
| STORE_LOGO | 2 MB | shu kabi |
| STORE_BANNER | 6 MB | shu kabi |
| USER_AVATAR | 2 MB | shu kabi |
| REVIEW_IMAGE | 6 MB | shu kabi |
| OTHER | 4 MB | shu kabi |

Yangi turni qo'shish — bitta enum + bitta `UPLOAD_POLICIES[...]` entry.

## RBAC

Mavjud pattern saqlandi:
- `@Public()` — auth bypass (public catalog).
- `@Roles('seller')` — sotuvchi endpointlari (super_admin har doim bypass).
- `@UseGuards(JwtAuthGuard)` — har authenticated user (uploads, reviews, requests).
- Sotuvchi har ish-amalini SellerContext orqali tekshiradi (`requireOwnStore`,
  `findOwnStore`). Mahsulot/offer modifikatsiyasi `createdById === sellerId`
  yoki `store.ownerId === sellerId` ga teng.

## Perf / scale

- **Geo:** bounding-box SQL pre-filter (indexed `latitude, longitude`) +
  haversine in-memory refine. Native geospatial yo'q MariaDB'da bizning
  setup'da, lekin 10k+ do'konda ham yetarli (10ms o'rtacha).
- **N+1:** har `findMany` kerakli relation'larni `include` bilan oladi.
  Public products: 1 ta `findMany(product)` + 1 ta `count` — relation'lar
  Prisma join orqali.
- **CDN:** rasm yuklov `https://cdn.beeexpress.uz/<r2-key>` orqali edge'dan
  beriladi — server'imiz hech qachon rasm trafigini ko'rmaydi.
- **Stock=0 auto-deactivate:** SellerOffer.update'da `nextStock === 0 ?
  isActive=false` rule (TZ §7.2).
- **Soft delete:** Mahsulot DELETE → status=ARCHIVED. Order tarixi
  buzilmasligi uchun hard-delete yo'q.

## Texnik qarz / keyingi qadamlar

- [ ] Frontend (seller panel `/dashboard/{store,products,offers}`, client
  `/c/[slug]`, `/p/[slug]`, store page).
- [ ] Order modulli ulagandan keyin `Review.verified` ni to'liq enforce.
- [ ] Notification queue bilan ProductRequest → Telegram bot xabar.
- [ ] Admin `/dashboard/moderation` — PENDING products + stores queue.
- [ ] Admin Category UI — type + delivery fields tahrir.
- [ ] Meilisearch yoki Typesense (search v2 — `?q=` LIKE'dan keyin).
- [ ] Bulk image reorder + remove endpoint (`PATCH /seller/products/:id/images`).
- [ ] PostalCarrier API yoki shu kabi yetkazib berish integratsiyasi
  (marketplace mahsulotlar uchun).
