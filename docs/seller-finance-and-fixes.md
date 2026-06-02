# Seller moliya + kichik tuzatishlar (W4)

## W4.1 — Seller Moliya sahifasi (404 → real)

Sidebar'da "Moliya" → `/dashboard/finance` linki bor edi, lekin sahifa **yo'q** edi
(404). TZ §19.6. Endi real ishlaydi (bo'sh stub emas).

**Backend** — `server/src/seller/finance/` (yangi modul, `@Roles('seller')`):
- `GET /seller/finance/summary` — `SellerContext.requireOwnStore()` orqali sotuvchining
  do'konini aniqlab, o'sha do'konning yetkazilgan buyurtmalari bo'yicha aggregat:
  `deliveredOrders`, `productSales` (subtotal — sotuvchi daromadi), `deliveryFees`
  (kuryerga o'tadi), `grossSales` (total), `todayOrders`, `todayProductSales`,
  `activeOrders` (jarayondagi). Mavjud `decimalToNumber` + Prisma aggregate.
- `SellerFinanceModule` `SellerModule` ga ulandi.

**Frontend** — `seller/src/app/dashboard/finance/page.tsx` (yangi) + `features/finance/api.ts`.
Client komponent, `statApi`-uslubidagi fetch, 6 ta `StatCard`. `formatSum` ishlatildi.
Do'kon hali ACTIVE bo'lmasa, `requireOwnStore` xabarini ko'rsatadi (boshqa seller
sahifalari bilan izchil).

## W4.2 — StatusBanner cheat-proofing

`seller/src/features/store/StatusBanner.tsx` switch faqat PENDING/ACTIVE/REJECTED/
SUSPENDED ni qamrardi (default yo'q). Tip 4 ta qiymatdan iborat, shuning uchun
amalda hech qachon yiqilmasdi, lekin backend kutilmagan status (masalan CLOSED)
yuborsa `cfg` undefined bo'lib oq ekran berishi mumkin edi. Xavfsiz `default`
branch qo'shildi (neytral banner). Pure himoya — joriy oqimni o'zgartirmaydi.

## Tekshiruv
- Server `tsc` + `nest build` toza (DI: SellerFinanceModule).
- Seller `tsc` toza; finance sahifa + api + StatusBanner lint-toza.

## Ataylab qoldirildi / kechiktirildi
- **Courier `isOnline` ochiq pool gating** — *ataylab qilinmadi*. Dispatch
  auto-assign allaqachon faqat online kuryerlarga biriktiradi; offline kuryer
  ochiq poolni ko'rishi (faqat ko'rish) zararsiz va munozarali xulq. Ishlayotgan
  xatti-harakatni taxmin asosida o'zgartirmadim.
- **Mahsulot yaratishda atributlar (D)** — kategoriyada "majburiy" atribut bo'lsa
  yaratish 400 berishi mumkin. Ovqat MVP kategoriyalarida majburiy atribut yo'q
  (latent). Tuzatish dinamik atribut-input formasini talab qiladi — alohida ish.
- **Do'kon logo/banner yuklash (E)** — rasm pipeline endi ishlaydi (local disk),
  shuning uchun qo'shsa bo'ladi; "missing" (buzuq emas), o'rtacha UI ishi.
