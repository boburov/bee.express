# Kuryer paneli v1

Kuryer (Courier) Mini App'ining to'liq oqimi: yaqin buyurtmalarni ko'rish va
qabul qilish, sotuvchidan olib xaridorga yetkazish, daromad va profilni
boshqarish. TZ §9 (buyurtma hayot sikli), §11 (kuryer ishi), §21 (kuryer
ilovasi funksiyalari) asosida. Bu hujjatdan oldin `/courier` faqat skelet edi
(login + bo'sh dashboard); endi panel uchdan-uch ishlaydi.

## Maqsad

- Kuryer **bo'sh (READY, hali olinmagan)** buyurtmalarni o'z radiusi ichida
  ko'rsin va bittasini **atomik** qabul qilsin (ikki kuryer bir buyurtmani ololmaydi).
- Qabul qilingach sotuvchi + xaridor manzili/telefoni ochilsin, holatni
  bosqichma-bosqich yangilasin: **Oldim → Yetkazdim**.
- Bugungi/haftalik/oylik daromad, sof daromad (platforma ushlovidan keyin) va
  yetkazma tarixi ko'rinsin.
- Profil: transport turi, ish radiusi, kategoriyalar, ish holati (Aktiv/Noaktiv).

## Buyurtma hayot sikli — kuryer qismi

Mavjud `OrderStatus` enum'iga bitta yangi holat qo'shildi: **`COURIER_ASSIGNED`**
(READY va ON_WAY orasida).

```
PENDING → ACCEPTED → PREPARING → READY
                                   │
              ┌────────────────────┴───────────────────┐
              │ (kuryer qabul qiladi)                   │ (sotuvchi o'zi yetkazadi)
              ▼                                          ▼
      COURIER_ASSIGNED ──(Oldim)──▶ ON_WAY ──(Yetkazdim)──▶ DELIVERED
              │
       (qaytarish: olishdan oldin)
              ▼
            READY  (yana bo'sh poolga)
```

- **READY → COURIER_ASSIGNED** — `POST /courier/orders/:id/accept`. `updateMany`
  ichidagi `where: { status: READY, courierId: null }` qulfi tufayli faqat
  birinchi kuryer yutadi; qolganlari **409 Conflict** oladi.
- **COURIER_ASSIGNED → ON_WAY** ("Mahsulotni oldim") — `pickedUpAt` yoziladi.
- **ON_WAY → DELIVERED** ("Yetkazdim") — `deliveredAt` yoziladi.
- **COURIER_ASSIGNED → READY** — kuryer olishdan oldin buyurtmani poolga qaytaradi
  (`release`); `courierId`, `courierAssignedAt`, `courierEarning` tozalanadi.

Sotuvchi oqimi buzilmagan: `READY → ON_WAY` (o'zi yetkazadigan do'kon, TZ §3.4)
hali ham mumkin. `COURIER_ASSIGNED` holatida sotuvchida harakat yo'q — kuryer
egalik qiladi.

## Ma'lumotlar bazasi o'zgarishi

Migration: `20260530091256_add_courier_assignment`.

`Order` jadvaliga qo'shildi:

| Maydon | Tur | Izoh |
|---|---|---|
| `courierId` | `String?` → `User` (`onDelete: SetNull`) | Buyurtmani olgan kuryer |
| `courierEarning` | `Decimal(12,2)?` | Kuryerning yetkazib berish foydasidagi ulushi (qabul vaqtida muhrlanadi) |
| `courierAssignedAt` | `DateTime?` | |
| `pickedUpAt` | `DateTime?` | |

- `Order.user` endi `@relation("CustomerOrders")`, `Order.courier` esa
  `@relation("CourierOrders")`. `User`'da: `orders` (mijoz sifatida) va
  `courierOrders` (kuryer sifatida).
- Yangi indeks: `@@index([courierId, status, createdAt])` — bo'sh pool skani
  (`status=READY, courierId=null`) va kuryerning o'z buyurtmalari uchun.
- **Kuryer profili** alohida jadval emas — `User.profile` (Json) ichidagi
  `courier` obyektida saqlanadi: `{ transportType, workRadiusKm, categories,
  isOnline }`. Schema'dagi "fully dynamic" yondashuviga mos.

**Daromad formulasi:** `courierEarning = round100(deliveryFee × 0.8)`
(`COURIER_DELIVERY_SHARE = 0.8`, TZ §11.4 — erkin kuryer yetkazish narxining
~70–80%ini oladi). Platforma ushlovi = `deliveryFee − courierEarning`.

## API kontrakti

Barcha endpoint'lar `@Roles('courier')` bilan himoyalangan; kuryer id'si
URL'dan emas, JWT'dan olinadi. Prefiks: `/api`.

| Metod | Yo'l | Vazifa |
|---|---|---|
| `GET` | `/courier/available?lat=&lng=&radiusKm=` | Bo'sh (READY, olinmagan) buyurtmalar. Geo bo'lsa bounding-box + haversine bilan radius ichida saralanadi; bo'lmasa butun pool. PII (telefon, aniq manzil) **yashirin**. |
| `POST` | `/courier/orders/:id/accept` | Atomik qabul → `COURIER_ASSIGNED`. Band bo'lsa 409. |
| `GET` | `/courier/orders?scope=active\|history` | O'z buyurtmalari (active = COURIER_ASSIGNED+ON_WAY, history = DELIVERED). To'liq ma'lumot (telefon ochiq). |
| `GET` | `/courier/orders/:id` | O'z buyurtmasi tafsiloti (pickup/dropoff geo, telefonlar, items, tarix). |
| `PATCH` | `/courier/orders/:id/status` | `{ status: "ON_WAY" \| "DELIVERED" }` — kuryer o'tishlari. |
| `POST` | `/courier/orders/:id/release` | `{ reason? }` — olishdan oldin poolga qaytarish. |
| `GET` | `/courier/stats` | today/week/month {deliveries, earning} + total {net, gross, platformCommission} + activeOrders. |
| `GET` | `/courier/profile` | Profil (transport, radius, kategoriyalar, isOnline, rating). |
| `PATCH` | `/courier/profile` | Profilni qisman yangilash (ism/familiya + courier sozlamalari). |

**Maxfiylik (TZ §16):** bo'sh pooldagi kartalarda sotuvchi/xaridor telefoni va
aniq manzil **ko'rinmaydi** — faqat masofa, daromad, mahsulot soni. Telefon va
to'liq manzil buyurtma **qabul qilingach** (o'z buyurtmasi) ochiladi.

## Ekran / UX (`/courier/dashboard/*`)

- **Boshqaruv** (`/dashboard`) — Aktiv/Noaktiv tugmasi, bugungi daromad +
  yetkazmalar, joriy faol buyurtma kartasi (yoki bo'sh holat CTA).
- **Yetkazmalar** (`/dashboard/deliveries`) — brauzer geolokatsiyasini so'raydi;
  "Faol buyurtmalarim" + "Mavjud buyurtmalar" (har birida **Qabul qilaman**).
  Geo rad etilsa — barcha buyurtmalar masofa-siz ko'rsatiladi.
- **Buyurtma tafsiloti** (`/dashboard/deliveries/[id]`) — naqd summa, olish
  (sotuvchi) va yetkazish (xaridor) kartalari (qo'ng'iroq + Yandex Maps
  deeplink), **Mahsulotni oldim / Yetkazdim** tugmalari, qaytarish, tarkib,
  holat tarixi.
- **Tarix** (`/dashboard/history`) — yakunlangan yetkazmalar (sana, masofa,
  summa, daromad), paginatsiya.
- **Daromad** (`/dashboard/earnings`) — bugun/hafta/oy kartalari + umumiy hisob
  (jami yetkazish to'lovi − platforma ushlovi = sof daromad).
- **Profil** (`/dashboard/profile`) — ism, transport turi, ish radiusi,
  kategoriyalar, ish holati toggle, reyting (hozircha "—").

Dizayn: courier app'ining mavjud `brand-*`/`ink-*` tokenlari, Inter shrifti,
Lucide ikonlar — admin/seller/client bilan vizual paritet.

## Tekshiruv

- `npx prisma migrate dev` — migration toza qo'llandi.
- Server `nest build` + `tsc --noEmit` — xatosiz. Courier `next build` — 8 route
  (shu jumladan `[id]`) muvaffaqiyatli.
- Seller + client `tsc --noEmit` — yangi `COURIER_ASSIGNED` holati ularning
  status xaritalariga ham qo'shildi (runtime'da `undefined` bo'lmasligi uchun).
- **E2E** (vaqtinchalik skript bilan, keyin tozalandi): courier token bilan
  profile get/update → available (order ko'rindi, telefon yashirin, earning=7200)
  → accept (200) → qayta accept (409) → ON_WAY → DELIVERED → noto'g'ri o'tish
  (400) → stats (today 1×7200, ushlov 1800) → history (1). Hammasi ✅.

## Keyingi qadamlar

- **Bildirishnomalar:** holat o'zgarishida xaridor/sotuvchi/kuryerga Telegram
  xabari (hozir faqat `OrderStatusHistory` yoziladi; bot job type kerak).
- **Admin kuryer moderatsiyasi** (TZ §18.3): kuryer arizasi (pasport, transport
  hujjati) + tasdiqlash/rad etish. Hozir profil maydonlari kuryerning o'zi
  to'ldiradigan erkin shaklda.
- **Kuryer reytingi** (TZ §17.2): `rating` hozir `null` — xaridor/sotuvchi
  kuryerga baho beradigan model kerak.
- **Kuryer turlari** (o'zimizniki / sotuvchi kuryeri / erkin) va ularga mos
  to'lov sxemasi — hozir hamma uchun yagona 80% ulush.
- **Bir vaqtda ko'p buyurtma** klasterlash (TZ §11.3) va jonli xarita.
