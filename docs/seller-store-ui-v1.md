# Sotuvchi paneli — Do'kon yaratish/tahrirlash UI (2026-05-28)

Backend `/api/seller/stores` modulining UI qatlami. Sotuvchi endi:
- Birinchi marta kirganda do'koni yo'qligini ko'rib, yaratishga taklif oladi
- `/dashboard/store` sahifada to'liq forma orqali do'kon yaratadi/tahrirlaydi
- Status banneri orqali moderatsiya holatini va Ochiq/Yopiq tugmasini ko'radi

**Tegishli TZ:** §19.1 Dashboard, §19.4 Filial (single-store v1), §19.7 Sozlamalar.

## Yangi/yangilangan sahifalar

| Route | Holat | Tafsilot |
| --- | --- | --- |
| `/dashboard/store` | YANGI | Yaratish forma (do'kon yo'q) yoki tahrirlash forma + status banner |
| `/dashboard` | yangilandi | Do'kon yo'q bo'lsa "Do'kon yarating" CTA card; bor bo'lsa StatusBanner |

## Tuzilishi

```
seller/src/
├── features/store/
│   ├── types.ts          # Store, OpeningHours, CreateStoreDto, UpdateStoreDto
│   ├── api.ts            # getMine, create, updateMine, toggleOpen
│   ├── hooks.ts          # useMyStore (null = no store yet, not an error)
│   ├── StoreForm.tsx     # 4 ta cardli to'liq forma
│   └── StatusBanner.tsx  # status + Open/Close toggle
└── app/dashboard/
    ├── page.tsx          # yangilandi: do'kon CTA yoki StatusBanner
    └── store/page.tsx    # YANGI
```

## Forma tarkibi (4 ta card)

### 1. Asosiy ma'lumotlar
- **Nomi** (majburiy, 2-120 belgi)
- **Slug** (ixtiyoriy, bo'sh qoldirilsa server avtomatik nomidan yaratadi)
- **Tavsif** (textarea, 0-2000 belgi)

### 2. Yuridik (KYC)
- **INN/STIR** (raqamli)
- **Yuridik nom** ("BeeFood" MChJ kabi)

Bu maydonlar ixtiyoriy, lekin tasdiqlash uchun zarur — banner'da explicit eslatma.

### 3. Aloqa va joylashuv
- **Telefon** (text, +998 90 …)
- **Manzil** (text)
- **Latitude + Longitude** (geo pair, server `assertGeoPaired` orqali tekshiradi)
- **"Hozirgi joylashuvni olish"** tugmasi — `navigator.geolocation` orqali avtomatik to'ldiradi
- Hint: FOOD xaridorlar faqat shu radius ichida ko'radi

### 4. Yetkazib berish (ixtiyoriy override)
- **Radius (km)** — kategoriya default'ni bekor qiladi
- **Asosiy narx (so'm)** — base fee
- **1 km narxi (so'm)** — per-km
- **O'rtacha vaqt (daqiqa)** — ETA
- **Minimal buyurtma (so'm)** — kichik buyurtma rad etiladi

Bo'sh qoldirilsa kategoriya default'i ishlatiladi (backend logikasi).

## Status banner

`StatusBanner` 4 holatga ko'ra rang/icon/tavsifni o'zgartiradi:

| Status | Rang | Icon | Action |
| --- | --- | --- | --- |
| PENDING | Sky (info) | Clock | Tugma yo'q |
| ACTIVE | Green (success) | CheckCircle2 | **Open/Close toggle** (yopilgan bo'lsa "Ochish", aks holda "Yopish") |
| REJECTED | Red (danger) | XCircle | `rejectionReason` ko'rsatiladi |
| SUSPENDED | Amber (warning) | AlertTriangle | Admin bilan bog'lanish CTA |

`ACTIVE` holatda yon-yonda 2 ta badge: status + `Ochiq`/`Yopiq`.

## Dashboard yangilanishi

Sotuvchi `/dashboard`'ga kirganda **birinchi navbatda do'kon holatini ko'radi**:

```
- Do'kon yo'q   → "Do'kon yarating" CTA card + Keyingi qadamlar
- Do'kon bor    → StatusBanner (status + open/close)
                  → Active bo'lmasa: Keyingi qadamlar ro'yxati
                  → Active bo'lsa: "Statistika tez orada" placeholder
```

Bu MVP onboarding'ning eng muhim qadami — yangi sotuvchi adashmaydi.

## Backend bilan ulanish

| Endpoint | Ishlatish |
| --- | --- |
| `GET /api/seller/stores/me` | Sahifa yuklanganda, dashboard'da, store sahifasida |
| `POST /api/seller/stores` | Birinchi marta yaratish |
| `PATCH /api/seller/stores/me` | Tahrirlash |
| `PATCH /api/seller/stores/me/open` | StatusBanner toggle |

Hammasi `@Roles('seller')` himoyalangan.

## v1 cheklov + keyingi sprint

| | Sabab | Keyingi qadam |
| --- | --- | --- |
| **Logo/Banner upload** yo'q | R2 credentials yo'q — 503 qaytaradi | R2 keys + image picker komponenti |
| **Opening hours UI** yo'q | Haftalik picker alohida komponent | Mon-Sun jadval (open/close per day) keyingi sprint |
| **Bir sotuvchi = bitta do'kon** | TZ §19.4 v1 cheklov | v2 multi-branch (filiallar) |
| **Slug ko'rsatish** | Backend slug yaratadi, UI faqat input field | Real-time slug preview keyingi sprint |

## Tekshirildi

- `npx tsc --noEmit` (seller) — toza
- Visual: keyingi sprint'da (RAM tejash uchun)
- Backend: oldindan `seller/stores` modul `38/38` smoke test'da o'tgan

## Demo bilan testlash

Demo seed (`npm run db:seed:demo`) 20 sotuvchi va 20 do'konni avtomatik yaratadi (status ACTIVE). Yangi sotuvchi sifatida test qilish uchun:

1. Yangi user yarating (telefon `701000000` kabi) — role 'seller'
2. JWT mintsalang (bee-smoke.js pattern)
3. `/dashboard` ochiladi → "Do'kon yarating" CTA ko'rinadi
4. `/dashboard/store` → forma → submit → status PENDING bo'lib qaytadi
5. Admin paneldan `/dashboard/sellers` orqali ACTIVE qiling (bu UI hali yo'q — DB to'g'ridan-to'g'ri `UPDATE Store SET status='ACTIVE'`)

## Keyingi qadam (TZ tartibi)

Endi sotuvchi do'koni bor → **`/dashboard/products`** (TZ §19.2):
- Mavjud master mahsulot qidirish
- Yangi mahsulot yaratish wizard
- Offer (narx + stock) qo'shish
- Stock 0 ga tushganda auto-deactivate

Bu sotuvchi MVP'ni yopiladi — mahsulot qo'sha olishi shart.
