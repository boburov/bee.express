# Catalog v1 — Feature Specification

**Status:** Draft
**Owner:** BeeExpress jamoasi
**Sana:** 2026-05-23
**Background:** Auth (Telegram bot + Mini App) tayyor. Bu PRD marketplace'ning birinchi domain bo'limini — Catalog'ni — yozadi.

## 1. Maqsad

Uzum/Amazon-style **shared catalog** marketplace yaratish: bitta master mahsulot (masalan "iPhone 15 Pro 128GB Black") ko'p sotuvchining takliflarini ko'rsatadi. Xaridor narx + reyting bo'yicha sotuvchini tanlaydi.

**Tanlangan modellar:**
- ✅ Shared catalog (master Product → ko'p SellerOffer)
- ✅ ProductVariant (rang/o'lcham/RAM)
- ✅ Dinamik atributlar (kategoriya bo'yicha)

## 2. Aktorlar va asosiy oqimlar

### 2.1. Super Admin
- Kategoriya daraxtini boshqaradi (root + sub'lar, sortOrder, icon, isActive)
- Brendlarni qo'shadi/tasdiqlaydi
- Har kategoriya uchun atribut to'plamini sozlaydi (RAM, ekran o'lchami, rang...)
- Mahsulot va do'kon moderatsiyasini bajaradi
- Banner, sale kabi promo'larni qo'yadi (keyingi versiyada)

### 2.2. Sotuvchi (Seller)
1. Do'kon yaratadi (Store) → KYC hujjat → moderatsiya → faollashadi
2. Mahsulot qo'shish:
   - Avval qidiradi: "iPhone 15 Pro 128GB Black mavjudmi?" → mavjud bo'lsa → o'z offer'ini qo'shadi (narx + qoldiq)
   - Mavjud bo'lmasa → yangi master Product yaratadi → moderatsiyaga ketadi → tasdiqlanganda offer'i ham faollashadi
3. Offer'lari ro'yxati — narx/qoldiq tahrirlash, faol/passiv qilish
4. Qoldiq tugaganda avtomatik passive (yoki sotuvchi qo'lda)

### 2.3. Xaridor (Mini App)
1. Asosiy sahifa — kategoriyalar grid, mashhur mahsulotlar
2. Kategoriya → mahsulot grid (variant + kategoriya atributlari bo'yicha filter, narx oralig'i, sotuv/reyting bo'yicha sort)
3. Mahsulot sahifasi — galereya, atributlar, **takliflar ro'yxati** (Shop A 12.5M, Shop B 12.8M...) + reyting
4. "Sotib olish" tugmasi → tanlanagn offer savatga tushadi
5. Qidiruv — title + brend + atribut value bo'yicha

## 3. Data Model (Prisma)

```prisma
// ─── Kategoriya daraxti ───
model Category {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String   // ko'rsatuv (uz)
  nameRu      String?  // ru
  parentId    String?
  parent      Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryTree")
  iconUrl     String?
  imageUrl    String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  // M:N: qaysi atributlar shu kategoriyada ishlatiladi
  attributes  CategoryAttribute[]
  products    Product[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([parentId])
  @@index([isActive])
}

// ─── Brend ───
model Brand {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  logoUrl   String?
  isActive  Boolean  @default(true)
  products  Product[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ─── Atribut (filter va spec uchun) ───
enum AttributeType {
  SELECT   // bitta tanlov (Rang: qora)
  MULTI    // bir nechta (Xususiyat: WiFi, Bluetooth)
  NUMBER   // raqam (RAM: 8, ekran: 6.7)
  TEXT     // erkin matn (Mato: paxta)
  BOOL     // ha/yo'q (Suvga chidamli: ha)
}

model Attribute {
  id           String   @id @default(cuid())
  slug         String   @unique  // "ram", "color"
  name         String   // "RAM"
  nameRu       String?
  type         AttributeType
  unit         String?  // "GB", "sm", "kg"
  isFilterable Boolean  @default(true)
  values       AttributeValue[]  // SELECT/MULTI uchun
  categories   CategoryAttribute[]
  productValues ProductAttributeValue[]
  variantOptions VariantOption[]
  createdAt    DateTime @default(now())
}

model AttributeValue {
  id          String @id @default(cuid())
  attributeId String
  attribute   Attribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  value       String // "qora", "8"
  label       String? // ko'rsatuv (rang uchun ham bo'lishi mumkin)
  hexColor    String? // rang uchun
  sortOrder   Int    @default(0)
  @@unique([attributeId, value])
}

// Kategoriya-Atribut bog'lanishi (Telefon kategoriyasida RAM, ekran, ... ishlatiladi)
model CategoryAttribute {
  categoryId  String
  attributeId String
  isRequired  Boolean @default(false)
  sortOrder   Int     @default(0)
  category    Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  attribute   Attribute @relation(fields: [attributeId], references: [id], onDelete: Cascade)
  @@id([categoryId, attributeId])
}

// ─── Mahsulot (master, sotuvchi-bog'liq emas) ───
enum ProductStatus {
  DRAFT
  PENDING      // moderatsiyada
  ACTIVE
  REJECTED
  ARCHIVED
}

model Product {
  id          String @id @default(cuid())
  slug        String @unique
  title       String
  titleRu     String?
  description String? @db.Text
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  brandId     String?
  brand       Brand?   @relation(fields: [brandId], references: [id])
  status      ProductStatus @default(PENDING)
  createdById String  // sotuvchi (User.id) yoki super admin
  // Mahsulot darajasidagi spec (variantga bog'liq emas) — RAM, ekran
  attributeValues ProductAttributeValue[]
  // Variantlar (kamida 1 ta)
  variants    ProductVariant[]
  images      ProductImage[]
  rejectionReason String? @db.Text
  publishedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([categoryId, status])
  @@index([brandId])
  @@index([status])
}

// Product → Attribute → Value (faqat SELECT/MULTI uchun valueId, NUMBER/TEXT/BOOL uchun rawValue)
model ProductAttributeValue {
  id          String @id @default(cuid())
  productId   String
  attributeId String
  valueId     String? // SELECT/MULTI: AttributeValue.id
  rawValue    String? // NUMBER/TEXT/BOOL: serialized value
  product     Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  attribute   Attribute @relation(fields: [attributeId], references: [id])
  @@index([productId])
  @@index([attributeId, valueId])
  @@index([attributeId, rawValue])
}

// ─── Variant (SKU) ───
// Variant = mahsulotning aniq versiyasi (Qora + 128GB)
model ProductVariant {
  id        String @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku       String? @unique
  title     String? // "iPhone 15 Pro 128GB Qora" — generated yoki qo'lda
  // Variantning option qiymatlari (rang=qora, hajm=128GB)
  options   VariantOption[]
  // Sotuvchilarning shu variantga takliflari
  offers    SellerOffer[]
  images    ProductImage[]
  isDefault Boolean @default(false)
  createdAt DateTime @default(now())
  @@index([productId])
}

// VariantOption — variantning aniq atribut qiymati (rang=qora)
model VariantOption {
  variantId   String
  attributeId String
  valueId     String  // AttributeValue.id (rang variantlari odatda SELECT)
  variant     ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  attribute   Attribute      @relation(fields: [attributeId], references: [id])
  @@id([variantId, attributeId])
}

// ─── Rasm ───
model ProductImage {
  id        String @id @default(cuid())
  productId String?
  variantId String?
  url       String
  alt       String?
  sortOrder Int    @default(0)
  product   Product?        @relation(fields: [productId], references: [id], onDelete: Cascade)
  variant   ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Cascade)
  @@index([productId])
  @@index([variantId])
}

// ─── Do'kon (Store) ───
enum StoreStatus {
  PENDING
  ACTIVE
  SUSPENDED
  CLOSED
}

model Store {
  id          String @id @default(cuid())
  ownerId     String  // User.id (sotuvchi)
  slug        String @unique
  name        String
  description String? @db.Text
  logoUrl     String?
  bannerUrl   String?
  status      StoreStatus @default(PENDING)
  // KYC
  inn         String?  // STIR
  legalName   String?
  // moderatsiya
  rejectionReason String? @db.Text
  approvedAt  DateTime?
  offers      SellerOffer[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([ownerId])
  @@index([status])
}

// ─── Sotuvchi taklifi (SellerOffer) ───
// Bitta variant uchun bitta do'kon = bitta offer
enum OfferCondition {
  NEW
  USED
  REFURBISHED
}

model SellerOffer {
  id          String @id @default(cuid())
  storeId     String
  variantId   String
  store       Store          @relation(fields: [storeId], references: [id], onDelete: Cascade)
  variant     ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)
  price       Decimal @db.Decimal(12, 2)   // so'mda
  oldPrice    Decimal? @db.Decimal(12, 2)  // chegirma uchun
  stock       Int     @default(0)
  condition   OfferCondition @default(NEW)
  isActive    Boolean @default(true)
  deliveryDays Int?   // taxminiy yetkazib berish
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([storeId, variantId])
  @@index([variantId, isActive, price])
  @@index([storeId])
}
```

**Indeks strategiyasi:**
- Mahsulot ro'yxati `(categoryId, status)` bo'yicha filtr
- Filtr `(attributeId, valueId)` va `(attributeId, rawValue)` bo'yicha
- Mahsulot sahifasidagi takliflar — `(variantId, isActive, price)` (eng arzonni tepada chiqarish)

## 4. API endpointlari (NestJS)

### 4.1. Public (`/api/v1/...`)
- `GET /categories/tree` — to'liq daraxt, faqat aktiv'lar
- `GET /categories/:slug` — bitta kategoriya + atributlari + child'lari
- `GET /products` — query: `?category=&attr.ram=8,16&priceMin=&priceMax=&sort=price|rating|new&page=`
- `GET /products/:slug` — to'liq detal (variants, images, attribute values, offers ro'yxati eng arzon birinchi)
- `GET /search?q=...` — title + brand + key attribute values bo'yicha
- `GET /stores/:slug` — do'kon sahifasi, uning aktiv offerlari

### 4.2. Seller (`/api/v1/seller/...`, role=seller)
- `POST /stores` — do'kon yaratish (PENDING)
- `PATCH /stores/me` — o'z do'kon ma'lumotlarini yangilash
- `GET /products/search?q=` — master katalogdan qidirish
- `POST /products` — yangi master mahsulot (PENDING)
- `GET /offers` — o'z takliflari ro'yxati
- `POST /offers` — yangi taklif: `{ variantId, price, stock, condition }`
- `PATCH /offers/:id` — narx/qoldiq/aktiv
- `DELETE /offers/:id`

### 4.3. Super Admin (`/api/v1/admin/...`)
- Categories: CRUD + reorder + attribute attach/detach
- Brands: CRUD
- Attributes: CRUD + values CRUD
- Products: list + `PATCH /products/:id/approve`, `/reject`
- Stores: list + approve/reject/suspend

## 5. UI Flow'lar (high level)

### 5.1. Admin paneli (`/admin`)
- `/admin/categories` — daraxt, drag-drop, "Yangi kategoriya"
- `/admin/categories/:id` — atributlarni biriktirish, isRequired
- `/admin/attributes` — atribut + values manager
- `/admin/brands` — ro'yxat + CRUD
- `/admin/moderation` — kutayotgan Product va Store'lar, approve/reject reason bilan

### 5.2. Sotuvchi paneli (`/seller`)
- `/seller/onboarding` — do'kon yaratish + KYC
- `/seller/products` — o'z offer'lari ro'yxati (variant nomi + narx + qoldiq + holat)
- `/seller/products/add` — 2 qadam: (1) master qidirish/tanlash (2) offer to'ldirish
- `/seller/products/new` — yangi master Product wizard (kategoriya → atributlar → variantlar → rasmlar → submit)

### 5.3. Xaridor Mini App (`/`)
- `/` — kategoriya grid + carousel
- `/c/:slug` — kategoriya bo'yicha mahsulot grid + sidebar filter (kategoriya atributlari, narx range)
- `/p/:slug` — mahsulot detal: galereya, variant tanlash (rang/o'lcham), atributlar jadvali, takliflar accordion ("12 ta sotuvchi" → ro'yxat, narx bo'yicha sort)
- `/p/:slug` da "Sotib olish" → bu offer'ni savatga qo'shadi (Cart feature keyingi PRD'da)
- `/search?q=`
- `/store/:slug` — do'kon sahifasi

## 6. Edge case va biznes qoidalar

- **Yangi mahsulot moderatsiyasi:** sotuvchi qo'shgan yangi master Product PENDING bo'ladi. Admin tasdiqlamaguncha mahsulot va uning offer'lari xaridorga ko'rinmaydi. Offer'ning ko'rinishi `product.status = ACTIVE AND offer.isActive AND offer.stock > 0`.
- **Mahsulot mavjud bo'lsa-yu yangi qilib qo'shsa (dublikat):** Admin reject + reason. Keyinroq — fuzzy duplicate detection.
- **Stock = 0 bo'lsa:** offer avtomatik xaridor ro'yxatidan tushadi. Sotuvchi paneli'da "Qoldiqsiz" ogohlantirish.
- **Variantsiz mahsulot:** har Product'ning kamida 1 ta `ProductVariant` (isDefault=true) bo'lishi shart. Variantlari bo'lmasa, default — bitta no-option variant.
- **Atribut tasdiqi:** Super Admin yangi atribut qo'shganda u darhol foydalanishga tayyor. Lekin atributni o'chirish — agar mahsulotlarda ishlatilgan bo'lsa, soft-delete (isActive=false).
- **Narx Decimal(12,2):** so'm 12 ta raqam yetadi (1 milliard +). Decimal — float xatolaridan saqlaydi.

## 7. Ish hajmi va bo'lim tartibi

Quyidagi tartib — har bir bo'lim alohida PR/sprintda yopiladi:

| # | Bo'lim | Bog'liqlik | Taxminiy hajm |
|---|---|---|---|
| 1 | **DB schema + migration** | yo'q | 1 PR |
| 2 | **Admin: Categories + Attributes + Brands** | 1 | 2 PR (BE + FE) |
| 3 | **Seller: Store onboarding** | 1 | 1 PR (BE + FE) |
| 4 | **Seller: Product create (master) + Moderation queue** | 1, 2, 3 | 2 PR |
| 5 | **Seller: Offer CRUD** | 4 | 1 PR |
| 6 | **Public: Categories + Products listing + filter** | 1-5 | 2 PR (BE + FE) |
| 7 | **Public: Product detail + offers** | 6 | 1 PR |
| 8 | **Search (oddiy LIKE-based, keyin meilisearch/typesense)** | 6 | 1 PR |

## 8. Keyingi versiyalar (out of scope v1)

- Mahsulot reytingi va sharhlar (Reviews feature)
- Sale, kupon, chegirma kampaniyalari (Promotions)
- Tavsiya (recommendations)
- Wishlist
- Comparison
- Stock harakati tarixi (audit log)
- Bulk import (CSV/Excel)
- Multi-language (ru/en) admin UI

## 9. Ochiq savollar

1. Rasm xosting: AWS S3, Cloudflare R2, yoki o'z server'imiz? (Hozircha — local `/uploads`, keyin migrate)
2. Slug auto-generation: title'dan? Cyrillic → Latin transliteration kerakmi?
3. Atribut qiymatlari ko'p tilda? (uz/ru tarjima zarurmi)
4. Variantsiz "Qum 1 tonna" kabi mahsulotlar uchun special UI kerakmi?
5. Mahsulot 1 dan ortiq kategoriyaga tegishli bo'lishi mumkinmi? (Hozir — yo'q, bitta categoryId)
