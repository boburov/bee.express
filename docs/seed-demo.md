# Demo seed — Uzbek fake data (2026-05-28)

MVP testlash uchun Toshkent-localized fake data. Real (non-demo) ma'lumotga
tegmaydi — har entity `demo-*` slug yoki `70xxxxxxx` telefon prefiksi bilan
belgilangan.

## Komandalar

```bash
cd server
npm run db:seed:demo         # qayta yaratish (avval o'chiradi)
npm run db:seed:demo:clear   # faqat o'chirish
```

**Eslatma:** avval `npm run db:seed` (base) — bu rolelar va SuperAdmin'ni
yaratadi. Demo seed shularga tayanadi.

## Nima yaratiladi

| Entity | Soni | Tafsilot |
| --- | --- | --- |
| FOOD kategoriya | 8 | Lavash, Burger, Pizza, Milliy taom, Somsa, Shashlik, Ichimliklar, Shirinliklar |
| MARKETPLACE kategoriya | 4 | Elektronika, Kiyim-kechak, Uy mollari, Kitoblar |
| Brendlar | 7 | Samsung, Xiaomi, Apple, LG, Hisar, Korzinka, Makro |
| Xaridorlar | 50 | O'zbek nomlari (Akmal, Madina, Sherzod…), telefon `7000000xx` |
| Sotuvchilar | 20 | 60% FOOD do'kon, 40% MARKETPLACE |
| Kuryerlar | 5 | (Hozircha foydalanilmaydi — courier paneli yo'q) |
| Do'konlar | 20 | Toshkent koordinatalari (bbox 41.24-41.38 × 69.18-69.33), tasodifiy lat/lng, ACTIVE + isOpen |
| Mahsulotlar | ~40 | Real nomlar: Big Lavash, Cheese Burger, Margarita, Toy oshi, va h.k. |
| Offer'lar | ~80 | Har mahsulot 1-3 ta sotuvchida (random subset) |
| Manzillar | ~75 | Har xaridorda 1-2 ta, Toshkent tumanlari |
| Buyurtmalar | 30 | Turli status'larda (PENDING/ACCEPTED/PREPARING/READY/ON_WAY/DELIVERED — DELIVERED ko'p) |

## Realistik ma'lumotlar

**Ismlar:** `FIRST_NAMES` + `LAST_NAMES` ro'yxati (`seed.demo.ts` da). Akmal Karimov, Madina Yusupova kabi kombinatsiyalar.

**Telefonlar:** `998 70xxxxxxx` — fake `70` prefiksi (real O'zbek operatorlari `90/91/93/94/95/97/99`), demo'ni real foydalanuvchilardan ajratish uchun.

**Manzil:** `<tuman> tumani, <ko'cha> ko'chasi, <uy>-uy`. Tumanlar: Mirobod, Yunusobod, Chilonzor, Yakkasaroy, Olmazor, Sergeli, Mirzo Ulug'bek. Ko'chalar: Amir Temur, Mustaqillik, Navoiy, Beruniy, Buyuk Ipak Yo'li.

**Do'kon nomlari:** Lavash Paradise, Burger Town, Tashkent Pizza, Osh Center, TechWorld, Phone Bazar va h.k.

**Buyurtma raqamlari:** `DEMO-00001 … DEMO-00030` — real `BEE-YYMMDD-…` formatidan farq qiladi, demo ekanini darhol ko'rinadi.

## Mahsulot narxlari (so'm)

| Toifa | Diapazon |
| --- | --- |
| Lavash | 15 000 – 42 000 |
| Burger | 28 000 – 65 000 |
| Pizza | 60 000 – 120 000 |
| Osh | 25 000 – 50 000 |
| Somsa | 8 000 – 16 000 |
| Shashlik | 18 000 – 40 000 |
| Ichimliklar | 3 000 – 14 000 |
| Telefon | 1 800 000 – 2 900 000 |
| TV | 3 500 000 – 4 500 000 |
| Kiyim | 55 000 – 650 000 |

500 so'mga yaxlitlanadi (realistik narxlar).

## Idempotent

Seed skripti har safar **avval clear qiladi**, keyin yaratadi. Demak xohlagancha qayta ishga tushiring — duplicate xato bo'lmaydi. Slug'lar va telefon prefiksi orqali nima demo ekanini aniqlaydi.

## Test login

Demo customer/seller'larga kirish uchun **OTP yo'q** (telefon real emas, bot yubora olmaydi). Variantlar:

### 1. Direct DB token (eng tez)

```bash
# Telefonni topish
psql/mysql -e "SELECT id, phone FROM User WHERE phone BETWEEN 700000000 AND 800000000 LIMIT 5;"
```

Keyin `JWT_ACCESS_SECRET` bilan token mintsalang (eski `bee-smoke.js` skripti pattern bilan).

### 2. Test mode (kelajakda)

`NODE_ENV=development` + `?testPhone=700000001` query bilan kirish — alohida feature.

## Tekshirildi

- `npx tsc --noEmit` (server) — toza
- Standalone script (`ts-node`) — Prisma types to'g'ri qaytaradi
- Idempotent — qayta ishga tushirish duplicate xato bermaydi (slug prefiksi)
- Foreign keys cascade qildi — `clear()` to'liq tozalaydi

## Cheklov + keyingi sprint

- **Rasm yo'q** — `ProductImage` jadval bo'sh qoladi (R2 sozlanmagan; ikkinchidan placeholder URL'lar UI'da broken ko'rinadi). Mahsulot card'lari ShoppingBag ikoni bilan ko'rinadi. Keyingi qadam: R2 to'liq sozlash + Cloudinary'dan placeholder rasmlar ko'chirish.
- **Sharhlar yo'q** — `Review` jadvali demo'da to'ldirilmaydi (hozir alohida UI yo'q). Order DELIVERED bo'lgach order ID bo'yicha sharh yozish UI keyingi sprint.
- **Attribute values yo'q** — `ProductAttributeValue` jadvali bo'sh (dinamik atributlar test qilinmaydi). Calories/RAM va h.k. — keyingi sprint.
- **Stock realistik emas** — random 20-100 (FOOD) / 5-30 (marketplace). Tugaganda restock simulation yo'q.

## Reset usuli

```bash
npm run db:seed:demo:clear   # faqat demo
npx prisma migrate reset      # BARCHA ma'lumotni o'chiradi — ehtiyot bo'ling
```
