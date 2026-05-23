# BeeExpress Marketplace — Features

**Yo'nalish:** Uzum-style umumiy marketplace (shared catalog, ko'p sotuvchi, Telegram Mini App xaridor uchun).
**Yangilangan:** 2026-05-23

## Status belgilari

- ✅ **Tayyor** — kod yozilgan, test qilingan, ishlayapti
- 🟡 **Qisman** — boshlangan lekin yakunlanmagan
- ⬜ **Reja** — hali kod yo'q, faqat reja yoki PRD bor
- 🔵 **Keyingi versiya** — v1 dan keyin (out of scope)

---

## 0. Infratuzilma

| Status | Feature | Tafsilot |
|---|---|---|
| ✅ | Server (NestJS) | `/server` — Express, Prisma, MariaDB adapter |
| ✅ | Database (MySQL/MariaDB) | Prisma 7 schema, migrations |
| ✅ | Redis (queue) | OTP delivery uchun ishlatiladi |
| ✅ | Bot (standalone) | `/bot` — grammy + ioredis + Prisma worker |
| ✅ | Client (Mini App) | `/client` — Next.js 16, Telegram WebApp SDK |
| ✅ | Admin panel | `/admin` — Next.js 16, super admin auth |
| ✅ | Shared Prisma schema | bot symlink qiladi → server `prisma/schema.prisma` |
| ⬜ | Seller panel | Alohida app yoki admin'ning seller-mode'i — qaror kerak |
| ⬜ | Courier panel | TZ'da bor edi, ammo Uzum-style'da odatda tizimning ichida |
| ⬜ | File/image hosting | Hozir lokal, keyin S3/Cloudflare R2 |
| ⬜ | CI/CD | Yo'q — keyingi bosqichda |
| ⬜ | Production deployment | Yo'q — Docker + reverse proxy kerak |
| ⬜ | Logging/monitoring | Faqat console — Sentry/Datadog kerak |

---

## 1. Auth & User Management

| Status | Feature | Tafsilot |
|---|---|---|
| ✅ | Phone OTP login (brauzer) | `POST /auth/phone/request` → bot OTP yuboradi → `/auth/phone/verify` |
| ✅ | Telegram Mini App auto-login | `POST /auth/telegram/mini-app` — initData HMAC tekshiruvi |
| ✅ | Super Admin login | username + bcrypt parol |
| ✅ | JWT access/refresh tokens | Session jadvali, IP + UA log |
| ✅ | Token refresh | `POST /auth/refresh` |
| ✅ | Logout | `POST /auth/logout` |
| ✅ | `/auth/me` | hozirgi user yoki super admin |
| ✅ | Role model (dinamik) | `Role` table — slug + permissions JSON |
| ✅ | RolesGuard + `@Roles()` | super admin barchasini bypass qiladi |
| ✅ | Audit log | `auth.login.phone`, `auth.login.miniapp`, `auth.login.superadmin` |
| ⬜ | User profile UI | first/last name, avatar — hali UI yo'q |
| ⬜ | Phone change flow | Boshqa raqamga ko'chish (OTP_PURPOSE=PHONE_CHANGE) |
| ⬜ | Super admin paroli almashtirish UI | Hozir faqat env'dan o'qiladi |
| ⬜ | Rol boshqaruv UI | `/admin/dashboard/roles` placeholder, kod yo'q |
| ⬜ | Permission tizimi | Permissions JSON bor, lekin tekshiruv yo'q |
| ⬜ | User block/unblock UI | DB'da `isBlocked` field bor, UI yo'q |

---

## 2. Telegram Bot

| Status | Feature | Tafsilot |
|---|---|---|
| ✅ | `/start` | telefon ulash, Mini App tugma |
| ✅ | `/app` | Mini App'ni ochish |
| ✅ | `/me` | foydalanuvchi hisobining holatini ko'rsatish |
| ✅ | `/help` | yordam |
| ✅ | Contact share handler | telefon → User upsert (mavjud Mini App-only userni ham yangilash) |
| ✅ | OTP delivery worker | Redis `beex:otp:send` queue'dan oladi, HTML formatda yuboradi |
| ✅ | Graceful shutdown | SIGINT/SIGTERM → bot.stop + worker abort |
| ⬜ | Order status xabarlari | Buyurtma holati o'zgarganda bot orqali xabar |
| ⬜ | Promo/marketing xabarlar | Broadcast bilan ehtiyot bo'lish kerak |
| ⬜ | Bot ↔ Mini App deep links | `start=order_<id>` parametrlari |

---

## 3. Mini App (Xaridor)

| Status | Feature | Tafsilot |
|---|---|---|
| ✅ | Telegram WebApp SDK | `telegram-web-app.js` beforeInteractive |
| ✅ | Theme integration | `--tg-bg`, `--tg-text` va h.k. → CSS vars |
| ✅ | `useTelegram` hook | ready(), expand(), themeChanged event |
| ✅ | Avto-login Mini App'da | `/auth/telegram/mini-app` chaqirig'i |
| ✅ | OTP fallback (brauzer) | Telegram tashqarida ham ishlaydi |
| ✅ | `/home` placeholder | foydalanuvchi profil ko'rsatuvi |
| ⬜ | Asosiy sahifa (home) | kategoriya grid + carousel + tavsiyalar |
| ⬜ | Kategoriya browse | `/c/[slug]` — mahsulot grid + filter sidebar |
| ⬜ | Mahsulot detal sahifasi | `/p/[slug]` — galereya + variant tanlash + offers list |
| ⬜ | Qidiruv | `/search?q=...` |
| ⬜ | Savat (Cart) | item qo'shish, miqdor, jami narx |
| ⬜ | Manzil tanlash | Yandex Maps yoki OpenStreetMap |
| ⬜ | Checkout | offer + manzil → buyurtma yaratish |
| ⬜ | Buyurtmalarim | order tarixi, holatlari |
| ⬜ | Wishlist | sevimlilar |
| ⬜ | Profil tahrirlash | ism, avatar, telefon |

---

## 4. Catalog v1 (PRD: `docs/catalog-v1.md`)

### 4.1. Database schema

| Status | Feature |
|---|---|
| ✅ | `Category` (tree, slug, sortOrder, isActive) |
| ✅ | `Brand` (slug, logo) |
| ✅ | `Attribute` (SELECT/MULTI/NUMBER/TEXT/BOOL, unit, isFilterable) |
| ✅ | `AttributeValue` (value, label, hexColor) |
| ✅ | `CategoryAttribute` (M:N, isRequired) |
| ✅ | `Product` (master, status: DRAFT/PENDING/ACTIVE/REJECTED/ARCHIVED) |
| ✅ | `ProductAttributeValue` (Product × Attribute × Value/rawValue) |
| ✅ | `ProductVariant` (sku, isDefault) |
| ✅ | `VariantOption` (Variant × Attribute × Value) |
| ✅ | `ProductImage` (productId yoki variantId) |
| ✅ | `Store` (KYC: inn, legalName, status) |
| ✅ | `SellerOffer` (Store × Variant × price/stock/condition) |
| ✅ | Migration applied | `20260523094841_add_catalog` |

### 4.2. Admin BE & UI (Bo'lim #2 PRD)

| Status | Feature | Endpoint / Route |
|---|---|---|
| ✅ | Brands CRUD (BE) | `GET/POST/PATCH/DELETE /api/admin/brands` |
| ✅ | Brands UI (admin) | `/dashboard/brands` |
| ✅ | Attributes CRUD (BE) | `GET/POST/PATCH/DELETE /api/admin/attributes` |
| ✅ | Attribute values CRUD (BE) | `/api/admin/attributes/:id/values` |
| ✅ | Attributes UI | `/dashboard/attributes` + `/dashboard/attributes/[id]` |
| ✅ | Categories CRUD (BE) | `GET/POST/PATCH/DELETE /api/admin/categories` |
| ✅ | Category tree endpoint | `GET /api/admin/categories/tree` |
| ✅ | Category reorder endpoint | `POST /api/admin/categories/reorder` |
| ✅ | Attach/detach attribute (BE) | `POST/DELETE /api/admin/categories/:id/attributes` |
| ✅ | Categories UI (tree + edit + attach) | `/dashboard/categories` + `/dashboard/categories/[id]` |
| ⬜ | Drag-and-drop reorder UI | Backend tayyor, frontend yo'q |
| ⬜ | Bulk seed (kategoriya/atribut) | Asosiy kategoriyalarni demo uchun seed qilish |

### 4.3. Seller BE & UI (Bo'lim #3-#5 — qolgan)

| Status | Feature | Endpoint / Route |
|---|---|---|
| ⬜ | **Bo'lim #3:** Store create + KYC | `POST /api/seller/stores`, `PATCH /api/seller/stores/me` |
| ⬜ | Store admin moderation | `/admin/dashboard/stores` queue, approve/reject |
| ⬜ | **Bo'lim #4:** Product search (master) | `GET /api/seller/products/search` |
| ⬜ | Master product create wizard | `POST /api/seller/products` (PENDING) |
| ⬜ | Product admin moderation | `/admin/dashboard/moderation` |
| ⬜ | **Bo'lim #5:** Offer CRUD | `GET/POST/PATCH/DELETE /api/seller/offers` |
| ⬜ | Stock auto-deactivate | stock=0 bo'lsa offer.isActive=false |

### 4.4. Public BE & UI (Bo'lim #6-#8 — qolgan)

| Status | Feature | Endpoint / Route |
|---|---|---|
| ⬜ | **Bo'lim #6:** Public categories tree | `GET /api/v1/categories/tree` |
| ⬜ | Public products listing | `GET /api/v1/products?category=&attr.ram=8&priceMin=&priceMax=&sort=` |
| ⬜ | Mini App browse UI | client `/c/[slug]` |
| ⬜ | Filter UI (atributlar + narx) | sidebar facets |
| ⬜ | **Bo'lim #7:** Product detail BE | `GET /api/v1/products/:slug` (offers sorted by price) |
| ⬜ | Mini App product page | client `/p/[slug]` — galereya, variant, offers |
| ⬜ | Store page | `GET /api/v1/stores/:slug` + client `/store/[slug]` |
| ⬜ | **Bo'lim #8:** Search (LIKE-based) | `GET /api/v1/search?q=` |
| 🔵 | Search (Meilisearch/Typesense) | v2 — performance kerak bo'lsa |

---

## 5. Cart & Checkout

| Status | Feature | Tafsilot |
|---|---|---|
| ⬜ | `Cart` model | userId, items[] (offerId + qty + priceAtAdd) |
| ⬜ | `Address` model | userId, label, lat/lng, text, isDefault |
| ⬜ | Cart API (BE) | `GET /api/v1/cart`, `POST /cart/items`, `PATCH/DELETE` |
| ⬜ | Address API (BE) | `/api/v1/addresses` CRUD |
| ⬜ | Cart UI (Mini App) | savat sahifasi, qty +/-, jami narx |
| ⬜ | Map picker UI | Yandex/OSM integratsiyasi |
| ⬜ | Checkout UI | manzil + delivery method + xulosa |
| ⬜ | Stock reservation | Buyurtma yaratish vaqtida stock vaqtincha band |

---

## 6. Orders

| Status | Feature | Tafsilot |
|---|---|---|
| ⬜ | `Order` model | userId, status enum, total, deliveryFee, addressSnapshot |
| ⬜ | `OrderItem` model | orderId, offerId snapshot (productTitle, variantTitle, price) |
| ⬜ | Order status lifecycle | NEW → CONFIRMED → PACKED → SHIPPED → DELIVERED / CANCELLED |
| ⬜ | Create order (BE) | `POST /api/v1/orders` from cart |
| ⬜ | Customer orders list | `GET /api/v1/orders` |
| ⬜ | Seller orders list | `GET /api/seller/orders` |
| ⬜ | Order detail | xaridor + sotuvchi versiyalari |
| ⬜ | Status update (seller) | `PATCH /api/seller/orders/:id/status` |
| ⬜ | Cancel order (customer) | `POST /api/v1/orders/:id/cancel` |
| ⬜ | Bot xabarlari | har status o'zgarishida xaridor + sotuvchiga xabar |
| ⬜ | Admin orders overview | barcha buyurtmalar, statistika |

---

## 7. Payments

| Status | Feature | Tafsilot |
|---|---|---|
| ⬜ | **v1:** Cash on Delivery (COD) | Faqat naqd, status flow yetarli |
| 🔵 | Payme | bank.payme.uz integration |
| 🔵 | Click | click.uz integration |
| 🔵 | Uzum Bank | uzumbank integration |
| 🔵 | Refund flow | Qaytarish + audit |
| 🔵 | Seller payout | Komissiyani ushlab, balansga qo'shish |
| 🔵 | Wallet/balance model | `Wallet`, `Transaction` |

---

## 8. Reviews & Ratings

| Status | Feature |
|---|---|
| ⬜ | `Review` model (productId, userId, rating, text, orderId) |
| ⬜ | Faqat DELIVERED buyurtmadan sharh qoldirish mumkin |
| ⬜ | Product reyting aggregatsiyasi (cache) |
| ⬜ | Seller (Store) reyting aggregatsiyasi |
| ⬜ | Sharh moderatsiyasi (admin) |
| ⬜ | Rasmlar sharhda |
| 🔵 | Sotuvchining sharhga javobi |

---

## 9. Promotions & Marketing

| Status | Feature |
|---|---|
| ⬜ | `Discount` model (mahsulot/kategoriya, % yoki absolute) |
| ⬜ | `Coupon` model (kod, foyalanish soni) |
| ⬜ | `Banner` model (home page hero) |
| ⬜ | Sale sahifasi |
| 🔵 | Flash sale (vaqtli) |
| 🔵 | Referral bonus |
| 🔵 | Cashback |

---

## 10. Search

| Status | Feature |
|---|---|
| ⬜ | v1: LIKE-based (title, brand, attribute values) |
| 🔵 | Meilisearch / Typesense |
| 🔵 | Suggest / autocomplete |
| 🔵 | Yozuv xatosini tuzatish (typo tolerance) |
| 🔵 | Sinonimlar |

---

## 11. Notifications

| Status | Feature |
|---|---|
| ✅ | Telegram OTP (auth) | Redis queue + bot worker |
| ⬜ | Order status (Telegram bot) | yangi job type queue'ga |
| ⬜ | Web push (browser) | service worker |
| 🔵 | SMS fallback (OTP) | telegram'da bot bloklangan bo'lsa |
| 🔵 | Email | hozircha email yo'q tizimda |

---

## 12. Admin (Super Admin) qolgan

| Status | Feature | Tafsilot |
|---|---|---|
| ✅ | Dashboard placeholder | `/dashboard` |
| ✅ | Login | super admin |
| ✅ | Sidebar nav | barcha bo'limlar uchun link'lar |
| ⬜ | Sellers ro'yxati + moderatsiya | `/dashboard/sellers` |
| ⬜ | Customers ro'yxati | `/dashboard/customers` |
| ⬜ | Couriers (TZ'da bor — kerak bo'lsa) | `/dashboard/couriers` |
| ⬜ | Orders monitoring | `/dashboard/orders` |
| ⬜ | Moderatsiya queue (mahsulot + do'kon) | yagona joy |
| ⬜ | Roles boshqaruvi | `/dashboard/roles` — Role CRUD + permissions |
| ⬜ | Audit log viewer | `/dashboard/audit` |
| ⬜ | Sozlamalar (komissiya %, yetkazib berish formulasi) | `/dashboard/settings` |
| ⬜ | Statistika dashboard | bugungi/oylik tushum, top sotuvchi va h.k. |
| ⬜ | Moliya (Finance) | `/dashboard/finance` — payout history |

---

## 13. Seller paneli

**Qaror kerak:** seller paneli alohida Next.js app bo'ladimi yoki admin app'ning seller-mode'i?

| Status | Feature |
|---|---|
| ⬜ | Loyiha tuzilishi tanlash | Alohida `/seller` app yoki shared `/admin` |
| ⬜ | Sotuvchi login | role=seller bo'lgan User'lar |
| ⬜ | Do'kon yaratish wizard | KYC hujjat upload |
| ⬜ | Mahsulot qo'shish wizard | master qidirish + offer to'ldirish |
| ⬜ | Mening offers'larim | narx/qoldiq tahrirlash |
| ⬜ | Buyurtmalar (sotuvchiga kelgan) | qabul qilish, holatini yangilash |
| ⬜ | Statistika | sotuvlar, daromad, top mahsulotlar |
| ⬜ | Balans + payout so'rovi | |

---

## 14. Texnik qarz (Tech Debt) & Quality

| Status | Feature |
|---|---|
| ⬜ | Unit testlar | hozir faqat default Nest spec'i bor |
| ⬜ | E2E testlar | Playwright/Cypress |
| ⬜ | API dokumentatsiyasi | Swagger/OpenAPI |
| ⬜ | Error tracking | Sentry |
| ⬜ | Performance monitoring | New Relic / Datadog |
| ⬜ | Rate limiting | OTP request endpoint xavfli |
| ⬜ | CSRF/CORS qattiq sozlamalar | hozir `origin: true` |
| ⬜ | JWT secret rotation | env'ni production'da o'zgartirish |
| ⬜ | Backup strategiyasi | MySQL dump cron |
| ⬜ | Docker setup | dev + prod compose |

---

## Tartib bo'yicha keyingi qadamlar (Roadmap)

1. **Bo'lim #3:** Seller Store onboarding (BE + admin moderation UI) — keyingi sprint
2. **Bo'lim #4-#5:** Seller product + offer flow — sotuvchi mahsulot qo'sha oladigan bo'ladi
3. **Bo'lim #6-#7:** Public catalog API + Mini App browse/detail sahifalari — xaridor mahsulot ko'ra oladigan bo'ladi
4. **Bo'lim #8:** Search v1 (LIKE)
5. **Cart & Checkout** — savat va buyurtma yaratish
6. **Orders** — buyurtma hayot sikli + bot xabarlari
7. **Reviews** — buyurtma yetkazilgandan keyin sharh
8. **Payments** — avval COD, keyin Payme/Click
9. **Promotions** — chegirma, kupon, banner
10. **Production prep** — Docker, CI/CD, monitoring, backup
