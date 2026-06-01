# BeeExpress — Documentation

BeeExpress loyihasining barcha **inson-o'qiydigan** texnik hujjatlari shu papkada.
Asosiy qoidalar:

- Har bir **task** yoki **feature** uchun alohida `.md` fayl yoziladi.
- Fayl nomi `kebab-case` (masalan, `auth-flow.md`, `catalog-v1.md`).
- Yangi fayl qo'shilganda — quyidagi indeksga link kiritiladi.
- Hujjatlar tilida o'zbek (lotin) — kod blokda ingliz texnik atamasi qoladi.

## Arxitektura va platforma

- [`architecture.md`](./architecture.md) — Loyihaning ko'p-paketli tuzilishi, panellar va
  server o'rtasidagi munosabat, har bir panel ichidagi FSD qatlamlari.
- [`auth-and-rbac.md`](./auth-and-rbac.md) — Auth oqimi (SuperAdmin password, telefon OTP,
  Telegram Mini App initData) va role-based access control (RBAC).
- [`design-system.md`](./design-system.md) — Visual guide pointer.
- [`mvp-skeleton.md`](./mvp-skeleton.md) — Birinchi MVP skeleton bosqichi (Admin + User
  Panel + shared UI + RBAC) yetkazib berilishi.

## Modul-spetsifik

- [`catalog-v1.md`](./catalog-v1.md) — Kategoriya / brend / atribut katalog modullari.
- [`admin-user-management.md`](./admin-user-management.md) — Admin Users + Audit + Roles
  modullari (server `admin/*` + admin panel `features/users|audit|roles`).
- [`client-design-refresh.md`](./client-design-refresh.md) — Client (Mini App)
  dizayn yangilash: emoji o'rniga Lucide ikonlar, `IconTile`, `Avatar`, polished
  topbar/bottom-nav.
- [`seller-panel-refresh.md`](./seller-panel-refresh.md) — Sotuvchi paneli dizayn +
  auth refresh: premium orange, Josefin Sans, FSD struktura, rol-gating
  token saqlashdan oldin.
- [`marketplace-v1.md`](./marketplace-v1.md) — Marketplace backend qatlami: R2
  uploads, seller stores/products/offers, public catalog (geo-aware), reviews,
  product requests, FOOD vs MARKETPLACE delivery logikasi.
- [`notifications-v1.md`](./notifications-v1.md) — Realtime notification tizimi:
  Socket.IO gateway, admin yuborish UI, target picker (user/role/broadcast),
  toast.
- [`typography-unify.md`](./typography-unify.md) — To'rt panelda Josefin Sans
  bir xillashtirildi; courier paneli Geist'dan o'tkazildi.
- [`typography-plus-jakarta.md`](./typography-plus-jakarta.md) — To'rt panel
  Josefin Sans'dan Plus Jakarta Sans'ga o'tkazildi (oldingi shrift).
- [`typography-inter.md`](./typography-inter.md) — To'rt panel Plus Jakarta
  Sans'dan Inter'ga o'tkazildi: serius minimalist sanoat standarti.
- [`cart-orders-v1.md`](./cart-orders-v1.md) — Savat + buyurtma backend:
  Address/Cart/Order modellari, sotuvchi bo'yicha split-checkout, status
  state machine, pagination envelope.
- [`ui-test-mobile-fixes.md`](./ui-test-mobile-fixes.md) — Playwright bilan
  4 panel × 3 viewport UI test: admin/seller sidebar mobile drawer pattern,
  courier panel palette migratsiyasi (sariq → orange).
- [`cart-orders-ui-v1.md`](./cart-orders-ui-v1.md) — Mini App buyurtma
  oqimi UI: /cart, /checkout, /orders, /orders/[id], /addresses sahifalar +
  cart badge + status state machine + inline manzil yaratish.
- [`seller-orders-ui-v1.md`](./seller-orders-ui-v1.md) — Sotuvchi paneli
  buyurtmalar UI: /dashboard/orders ro'yxat + /dashboard/orders/[id] detail
  + status transition tugmalari + Yandex Maps deeplink.
- [`catalog-browse-ui-v1.md`](./catalog-browse-ui-v1.md) — Mini App katalog
  ko'rib chiqish UI: /catalog (kategoriya tree), /c/[slug] (mahsulot grid),
  /p/[slug] (galereya + offer'lar + savatga qo'sh). Order full-loop yopildi.
- [`seed-demo.md`](./seed-demo.md) — O'zbek-localized demo seed: 12 kategoriya,
  20 sotuvchi, 50 xaridor, 40+ mahsulot, 30 buyurtma. `npm run db:seed:demo`.
- [`seller-store-ui-v1.md`](./seller-store-ui-v1.md) — Sotuvchi paneli do'kon
  yaratish/tahrirlash UI: /dashboard/store + dashboard CTA + StatusBanner.
- [`seller-products-ui-v1.md`](./seller-products-ui-v1.md) — Sotuvchi paneli
  mahsulot CRUD UI: /dashboard/products + new wizard + [id] edit + inline
  narx/qoldiq offer boshqaruv. Sotuvchi MVP yopildi.
- [`admin-moderation-v1.md`](./admin-moderation-v1.md) — Admin paneli
  moderatsiya: /dashboard/moderation tabs (products + stores) + approve/reject
  + StoreStatus REJECTED enum qo'shildi.
- [`courier-panel-v1.md`](./courier-panel-v1.md) — Kuryer Mini App to'liq oqimi:
  COURIER_ASSIGNED holati + courier* maydonlar, bo'sh pool (geo + PII gating),
  atomik accept, Oldim/Yetkazdim, daromad/tarix/profil. `/courier` modul + 6 sahifa.
- [`courier-contracts-v1.md`](./courier-contracts-v1.md) — Do'kon↔kuryer kontrakt:
  ariza→admin tasdiq→`courier` roli, kuryer so'rovi→sotuvchi tasdig'i, READY
  buyurtmani kontraktli kuryerga avto-biriktirish + band bo'lsa pool fallback +
  vaqtinchalik kontrakt. Server + kuryer/seller/admin paneli.
- [`security-hardening-v1.md`](./security-hardening-v1.md) — Production xavfsizlik:
  CORS allow-list, rate limiting (throttler), global exception filter, helmet,
  super-admin parol guard, kuryer Telegram SDK + pm2 port fix.
- [`uploads-images-v1.md`](./uploads-images-v1.md) — Rasm yuklash: direct multipart
  `POST /uploads/direct` (lokal disk + R2), static serving, seller ImageUploader
  (new/edit). Mahsulot yuklash zanjiri ishga tushdi.
- [`food-service-radius-v1.md`](./food-service-radius-v1.md) — FOOD xizmat radiusi:
  browse'da har do'kon o'z `deliveryRadiusKm` ichidagina ko'rinadi
  (`effectiveFoodRadiusKm`), + seller xarita orqali joylashuv tanlash (Leaflet/OSM).
- [`deployment-production.md`](./deployment-production.md) — Productionga chiqarish:
  jarayonlar/portlar, env, pm2, nginx + HTTPS (Let's Encrypt), Telegram Mini App
  HTTPS talabi, deploy checklist.
- [`features.md`](./features.md) — Feature progresi va keyingi reja.

## Yangi hujjat qo'shganda nima qilish kerak

1. `docs/<kebab-name>.md` faylini yoz.
2. Birinchi qatorda `# <Sarlavha>` va keyin paragraf bilan kontekst.
3. Bo'limlar: **Maqsad**, **Qanday ishlaydi**, **API kontrakti** (agar bo'lsa),
   **Ekran/UX**, **Keyingi qadamlar**.
4. Shu indekgsga qisqa havola qo'shing (1-2 satr).
