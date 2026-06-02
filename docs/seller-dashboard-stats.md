# Sotuvchi dashboard statistikasi (F6)

Avval sotuvchi dashboard'idagi kartalar "—" va "Statistika tez orada" edi. Endi
real raqamlar (admin dashboard patterni bilan, do'kon bo'yicha scope).

## Backend — `GET /seller/stats/summary` (`server/src/seller/stats/`)
`SellerContext.requireOwnStore()` orqali sotuvchining do'koni aniqlanadi, keyin
o'sha do'kon bo'yicha aggregat:
- `ordersToday` — bugun yaratilgan buyurtmalar soni
- `revenueToday` — bugun yetkazilgan buyurtmalar `subtotal` yig'indisi (sotuvchi
  daromadi; yetkazib berish to'lovi kuryerga ketadi — seller-finance bilan bir xil semantika)
- `activeProducts` — `SellerOffer` (isActive) soni
- `storeRating` — `Review._avg.rating` (isVisible), 1 kasrgacha (Store'da cache yo'q → live)
- `conversionPct` — yetkazilgan/jami buyurtma

`SellerStatsModule` `SellerModule` ga ulandi.

## Frontend — `seller/src/app/dashboard/page.tsx` + `entities/stats/api.ts`
Do'kon ACTIVE bo'lsa `statsApi.dashboard()` chaqiriladi va 5 ta `StatCard` to'ldiriladi
(`formatSum` tushum uchun, reyting `toFixed(1)`, konversiya `%`). ACTIVE bo'lmasa
"Keyingi qadamlar" kartasi qoladi. Eski "Statistika tez orada" empty-state olib tashlandi.

## Tekshiruv
- server `tsc` + `nest build` toza (DI: SellerStatsModule). seller `tsc` + lint toza.
