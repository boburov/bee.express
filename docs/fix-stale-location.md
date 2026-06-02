# Fix — xaridor lokatsiyasi yangilanmasligi

## Muammo
Bir marta o'rnatilgan lokatsiya o'zgarmasdi. Sabab: W1 dagi `bee-client-location`
(persisted zustand) **bir marta urug'lanib, localStorage'da muzlab qolardi** —
`useEnsureLocation` faqat `location == null` bo'lsa yozardi. Manzilni xaritada
o'zgartirsangiz ham eski koordinata qolib, home/nearby/topbar/FOOD-browse va
(eski manzil tanlansa) buyurtma dropoff'i, demak kuryer Google yo'nalishi ham
eski joyga ishora qilardi.

## Yechim
1. **`useEnsureLocation` endi reconcile qiladi** (urug'lash emas): har navigatsiyada
   manzillarni o'qib, aktiv lokatsiyani **manba manzil bilan sinxronlaydi** —
   ko'rsatayotgan manzilni (tahrir qilinsa koordinatasi yangilanadi), yo'q bo'lsa
   default'ni, yo'q bo'lsa birinchisini kuzatadi. Faqat farq bo'lsa yozadi (loop yo'q).
2. **`AddressForm` saqlaganda darhol** `useLocationStore.setLocation(saved)` chaqiradi —
   xaritada belgilab saqlangan manzil shu zahoti aktiv lokatsiya bo'ladi (navigatsiya/
   reload kerak emas). Checkout'da saqlangach o'sha manzil tanlanadi → buyurtma
   dropoff'i ham yangi → kuryer Google yo'nalishi to'g'ri manzilga.

## Natija
Manzilni o'zgartirish (xaritada) → ilova bo'ylab aktiv lokatsiya darhol yangilanadi;
eski muzlagan qiymat yo'q. Kuryerning `/maps/dir/{kuryer}/{xaridor}` linki yangi
koordinatani oladi.

## Fayllar
- `client/src/features/location/hooks.ts` — `useEnsureLocation` reconcile.
- `client/src/features/addresses/AddressForm.tsx` — saqlashda `setLocation`.

## Tekshiruv
- client `tsc` + lint toza.
