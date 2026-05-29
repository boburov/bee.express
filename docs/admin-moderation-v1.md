# Admin paneli — Moderatsiya UI (2026-05-29)

Backend `/api/admin/moderation/*` modullari va admin UI'si. Sotuvchi yaratgan
do'kon va mahsulotlarni admin ko'rib chiqib tasdiqlaydi yoki rad etadi.
Bundan oldin sotuvchi mahsuloti abadiy PENDING'da qolar edi — endi to'liq
oqim yopiladi.

**Tegishli TZ:** §18.6 Buyurtmalar (qisman) · §18.2 Sotuvchilar moderatsiya.

## Schema o'zgarishi

```prisma
enum StoreStatus {
  PENDING
  ACTIVE
  SUSPENDED
  CLOSED
  REJECTED   // ← yangi
}
```

Migration: `20260529101717_add_store_rejected_status`.

`Store.rejectionReason` field allaqachon mavjud edi — endi `REJECTED` enum
qiymati bilan to'g'ri ishlatiladi. Sotuvchi paneli `StatusBanner` ham bu
case'ni qabul qiladi.

## Yangi backend endpointlari (SuperAdmin-only)

```
GET    /api/admin/moderation/products?page&pageSize&q
POST   /api/admin/moderation/products/:id/approve
POST   /api/admin/moderation/products/:id/reject  { reason }

GET    /api/admin/moderation/stores?page&pageSize&q
POST   /api/admin/moderation/stores/:id/approve
POST   /api/admin/moderation/stores/:id/reject    { reason }
```

Server tuzilishi:

```
server/src/admin/moderation/
├── moderation.module.ts
├── dto/reject.dto.ts           # reason: 3-500 chars
├── products/
│   ├── moderation-products.controller.ts
│   └── moderation-products.service.ts
└── stores/
    ├── moderation-stores.controller.ts
    └── moderation-stores.service.ts
```

### State machine

```
PENDING  →  ACTIVE     (approve, publishedAt/approvedAt = now, rejectionReason = null)
PENDING  →  REJECTED   (with reason, sotuvchi UI ko'radi)
```

Boshqa holatdagi entity'ni approve/reject qilib bo'lmaydi (400). Sotuvchi
REJECTED entity'ni tahrirlaganda backend uni avtomatik PENDING'ga qaytaradi —
qayta moderatsiyaga keladi.

## Yangi admin sahifa

`/admin/dashboard/moderation` — 2 ta tab:
- **Mahsulotlar** — `usePendingProducts` hook, badge tab title'da PENDING soni
- **Do'konlar** — `usePendingStores`, badge bilan ham

Frontend tuzilishi:

```
admin/src/features/moderation/
├── types.ts   # PendingProduct, PendingStore, Paginated<T>
├── api.ts     # moderationApi (list/approve/reject)
└── hooks.ts   # usePendingProducts, usePendingStores

admin/src/app/dashboard/moderation/page.tsx
admin/src/shared/config/nav.ts   # 'Moderatsiya' linki Operatsiya bo'limida
```

## Asosiy UX

### 1. Tabs + counter
Tab title'ning yonida brand badge'da PENDING soni ko'rinadi. Admin darhol
bilib oladi qancha element kutmoqda.

### 2. Card-style cards (mahsulotlar)
Har mahsulot — 80x80 rasm + nomi + kategoriya + tavsif preview + narx/qoldiq
+ sotuvchi (kim yaratgan, telefon, sana). O'ng tomonida 2 vertical tugma:
**Tasdiqlash** (primary) va **Rad etish** (outline + red).

### 3. Card-style cards (do'konlar)
Logo + nomi + tavsif. Pastida grid: Egasi, Telefon, INN, Yuridik nom,
Manzil, Koordinatalar (Yandex Maps link), Radius, Asosiy fee, 1 km narxi.
Admin xohlagan ma'lumotni darhol ko'radi.

### 4. Reject sababi
`prompt()` orqali — 3+ belgi majburiy. Bu sotuvchiga ko'rinadi (UI'da
`rejectionReason`, banner'da). Admin'lar uchun reason'lar fixed enum
emas — istalgan matn yozish mumkin (idiomatic xato sabablarini admin'ning
soft policy'siga qoldiradik v1'da).

### 5. Per-item busy state
Bir mahsulotni tasdiqlash boshqa tugmani bloklamaydi — har card'ning o'zining
spinner state'i bor (`busy?.id === p.id`).

### 6. FIFO queue
Ro'yxat `createdAt ASC` tartibda — eng eski avval. Admin "navbat"ni o'tib
boradi, oxirgi yaratilgan PENDING'lar past tomonda.

### 7. Yandex Maps deeplink
Do'kon card'da koordinata ustiga bosish — yangi tab'da Yandex Maps ochiladi
do'kon nuqtasi belgilangan holda. Admin "real joymi?" deb tekshira oladi.

## Tekshirildi

- `npx prisma migrate dev` muvaffaqiyatli (`add_store_rejected_status`)
- `npx prisma generate` — yangi `REJECTED` enum value Prisma client'da
- `npx tsc --noEmit` (server) — toza
- `npx tsc --noEmit` (admin) — toza
- Admin nav: `/dashboard/moderation` linki Operatsiya bo'limida (Buyurtmalar
  va Bildirishnomalar orasida)

## Sotuvchiga ko'rinishi

REJECTED bo'lgan mahsulotni sotuvchi quyidagi yo'l bilan ko'radi:
1. `/dashboard/products` — status filter "Rad etilgan" chips bilan
2. `/dashboard/products/:id` — yuqorida qizil banner: "Admin rad etdi" + sabab
3. Sotuvchi tahrirlasa — server avtomatik status'ni PENDING'ga qaytaradi
   (server'da `SellerProductsService.update` — "Edits go back to PENDING")

Do'kon uchun ham xuddi shunday — StatusBanner REJECTED case'ida sabab
ko'rsatadi.

## v1 cheklov + keyingi sprint

| | Sabab | Keyingi qadam |
| --- | --- | --- |
| **Audit log integratsiya** | Approve/reject audit'ga yozilmaydi | `AuditService.log("moderation.approve", ...)` qo'shish |
| **Bot notification** | Sotuvchi REJECTED bo'lganini bilmaydi (bot xabari yo'q) | Telegram bot order events bilan birga keyingi sprint |
| **Reject template** | Reason'lar siyqalashmaydi | Tez-tez ishlatiladigan sabablar dropdown |
| **Toplu approve/reject** | 1 ta'dan | Checkbox tanlash + bulk action |
| **History tab** | Faqat PENDING ko'rsatadi | ACTIVE/REJECTED'larni ham ko'rish (ARCHIVED dan tashqari) |
| **DRAFT status** | UI'da DRAFT mahsulot ham ko'rinmaydi (faqat sotuvchi ko'radi) | DRAFT'lar moderatsiyaga jo'natilmaydi, demak shu yerda yo'q — to'g'ri |

## MVP holati yangilandi

| Komponent | Avval | Hozir |
|---|---|---|
| Admin paneli | 80% | **85%** (moderatsiya ✅; orders/finance/settings placeholder) |
| Umumiy MVP | ~80% | **~82%** |

### 🎯 Order full-loop endi haqiqiy

```
Sotuvchi: /dashboard/store → admin tasdiqlash
       → /dashboard/products → admin tasdiqlash
       → /dashboard/orders (buyurtma qabul qilish)

Xaridor: /catalog → /c/[slug] → /p/[slug] → savatga qo'sh
       → /cart → /checkout → /orders

Admin:  /dashboard/moderation (do'kon + mahsulot)
     →  /dashboard/notifications (e'lon)
     →  /dashboard/audit (kuzatish)
```

MVP'ning **funksional yadrosi to'liq tayyor**. Qoldi: image upload (R2),
courier paneli, statistika, bot notification'lar.

## Keyingi qadam (TZ tartibi)

- **R2 keys** — siz 3 ta env vars (access/secret/public URL) bering → image upload ishlay boshlaydi
- **Telegram bot order events** — TZ §15: status o'zgarganda xaridor/sotuvchiga push
- **Courier paneli** — TZ §21: butunlay yangi panel (eng katta hajm)

Qaysi birini?
