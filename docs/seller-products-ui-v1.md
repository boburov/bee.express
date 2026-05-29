# Sotuvchi paneli — Mahsulotlar UI (2026-05-28)

Backend `/api/seller/products` va `/api/seller/offers` modullari uchun UI.
Sotuvchi endi mahsulot qo'sha oladi, tahrirlaydi, narx/qoldiqni inline
boshqaradi va admin moderatsiyaga jo'natadi.

**Tegishli TZ:** §19.2 Mahsulotlar (master + offer flow).

## Yangi sahifalar

| Route | Maqsad |
| --- | --- |
| `/dashboard/products` | Mahsulot ro'yxati — status filter chips, pagination, status badge, narx + qoldiq, list rasm |
| `/dashboard/products/new` | Yangi mahsulot wizard: title + kategoriya + tavsif + ixtiyoriy boshlang'ich offer |
| `/dashboard/products/[id]` | Tahrirlash + inline offer (narx/qoldiq) edit + rasm placeholder + xavfli zona (o'chirish) |

## Tuzilishi

```
seller/src/
├── features/
│   ├── products/
│   │   ├── types.ts        # Product, Variant, Offer, ProductStatus, DTOs
│   │   ├── api.ts          # sellerProductsApi + sellerOffersApi
│   │   ├── hooks.ts        # useSellerProducts, useSellerProduct
│   │   └── status.ts       # PRODUCT_STATUS_META + LIST
│   └── categories/
│       └── api.ts          # fetchCategoriesTree, flattenCategories (public tree)
└── app/dashboard/products/
    ├── page.tsx            # ro'yxat
    ├── new/page.tsx        # YARATISH WIZARD
    └── [id]/page.tsx       # TAHRIRLASH + OFFER
```

## Backend bilan ulanish

| Endpoint | Ishlatish |
| --- | --- |
| `GET /api/seller/products` | List sahifa (q, status, categoryId, page, pageSize) |
| `GET /api/seller/products/:id` | Detail sahifa |
| `POST /api/seller/products` | Yaratish (title, categoryId + ixtiyoriy price/stock — default variant + offer ham yaratiladi) |
| `PATCH /api/seller/products/:id` | Tahrirlash (title, description) |
| `DELETE /api/seller/products/:id` | O'chirish |
| `PATCH /api/seller/offers/:id` | Inline narx/qoldiq update + isActive toggle |
| `GET /api/v1/categories/tree` | Picker uchun (public, auth talab qilmaydi) |

## Asosiy UX

### 1. List sahifa
- 5 status filter chips (Qoralama / Moderatsiyada / Faol / Rad etilgan / Arxivlangan) + "Barchasi"
- Card-style row: image placeholder, title, status badge, kategoriya, narx, qoldiq, ChevronRight
- `tabular-nums` narx/qoldiq uchun
- Pagination: 20/sahifa, kompakt "Oldingi · 1/5 · Keyingi"
- Empty state: status'ga ko'ra ikki xil ("Bu holatda mahsulot yo'q" / "Hali qo'shmagansiz" + CTA)

### 2. Create wizard
- 2 ta card: Asosiy + Boshlang'ich offer (ixtiyoriy)
- Kategoriya picker: `flattenCategories` — `Parent / Child / Grandchild` formati, faqat leaf'lar tanlanadi
- "Faqat leaf kategoriya tanlanadi. Yangi kategoriya kerak bo'lsa — admin'ga murojaat qiling." hint
- Backend `requireOwnStore` — agar do'kon yo'q yoki PENDING bo'lsa 403/404 qaytaradi (UI bu xatoni ko'rsatadi)
- Success: yaratilgan mahsulot detail sahifasiga redirect
- Footer: "Yaratilgan mahsulot avtomatik Moderatsiyada holatiga tushadi"

### 3. Detail / Edit / Offer
- Status badge + rejection reason (REJECTED bo'lsa qizil banner)
- Asosiy ma'lumotlar formasi (title + description) — Saqlash tugma
- **Narx va qoldiq** — har variant per offer inline edit:
  - Joriy narx ko'rsatish
  - Narx + Qoldiq input
  - Saqlash tugma
  - "Vaqtincha to'xtatish" / "Faollashtirish" (isActive toggle)
  - Backend `stock <= 0` bo'lsa avtomatik `isActive=false` qiladi
- Rasmlar bo'limi: placeholder (R2 sozlangach upload qo'shiladi)
- Xavfli zona: o'chirish (confirm)

### 4. Per-row busy state
Inline offer edit'da har offer alohida `busy: true/false` state — birini saqlash boshqasini blok qilmaydi. Spinner tugmada.

### 5. Optimistic emas
Saqlash → backend javob → `reload()` → freshreload. UX biroz sekin lekin ishonchli.

## v1 cheklov + keyingi sprint

| | Sabab | Keyingi qadam |
| --- | --- | --- |
| **Master qidirish yo'q** | TZ §19.2'da spec, lekin v1 sotuvchi to'g'ridan-to'g'ri master yaratadi | "Mavjud mahsulotni izlash" tugmasi keyingi sprint |
| **Variant boshqarish yo'q** | Default variant avtomatik yaratiladi | Variant qo'shish/o'chirish UI keyingi sprint |
| **Image upload yo'q** | R2 credentials yetishmaydi | R2 keys + image picker komponenti |
| **Brand picker yo'q** | Public brand endpoint yo'q | Yo `/v1/brands` endpoint qo'shamiz, yo seller-scoped picker yaratamiz |
| **Attribute values yo'q** | Dinamik category attributes (calories/RAM) UI yo'q | Kategoriya tanlangach atributlar formasi avtomatik tushadi |
| **Bulk edit yo'q** | Bir vaqtda 1 ta offer | CSV import yoki bulk select keyingi sprint |
| **Qidiruv (q=)** | Hozircha UI da yo'q lekin backend qabul qiladi | List sahifaga search input qo'shish |

## Tekshirildi

- `npx tsc --noEmit` (seller) — toza
- Backend kontraktiga mos (qo'lda DTO bilan solishtirildi)
- Sidebar nav linki `/dashboard/products` allaqachon mavjud edi — to'g'ri ulanadi

## MVP holati yangilandi

Endi sotuvchi:
1. ✅ Login (Phone OTP)
2. ✅ Do'kon yaratish
3. ✅ Mahsulot qo'shish + narx/qoldiq boshqaruv ⭐ YANGI
4. ✅ Buyurtmalarni qabul qilish + status yangilash

**MVP'ning sotuvchi tarafi to'liq tayyor** — endi sotuvchi mustaqil ishlashi mumkin.

Qoldi:
- Admin mahsulot moderatsiya queue (sotuvchi PENDING → admin ACTIVE qiladi) — admin UI'da hozircha yo'q
- Image upload (R2)
- Statistika (TZ §19.5)
- Moliya (TZ §19.6)

## Keyingi qadam (TZ tartibi)

Sotuvchi to'liq ishlash uchun **admin mahsulot moderatsiya queue** kerak —
`/admin/dashboard/moderation` (TZ §18.6). Aks holda sotuvchi yaratgan
mahsulot abadiy PENDING'da qoladi.
