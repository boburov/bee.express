# UI/UX overhaul 2026-06 (4 panel)

Egasi UI/UX sifatidan norozi — ko'p bosqichli ish. Ko'lam: alignment, kuryer+admin
polish, nav unread badge (seller+kuryer+admin), i18n uz/ru/krill (4 panel),
o'lik funksiyalarni tuzatish. Har bosqich egasiga ko'rsatiladi.

## Bosqich 1 — alignment + kuryer toggle (BAJARILDI)

### Alignment: sidebar logo chizig'i ↔ topbar border
**Muammo:** sidebar logo qutisi balandligi topbar `h-XX` ga teng emas edi, shuning
uchun ostidagi chiziqlar bir-biriga tekis tushmasdi ("qiyshiq").
- **Admin** ([Sidebar.tsx](../admin/src/widgets/sidebar/Sidebar.tsx)): logo qutisi
  `px-5 py-[16.5px]` (65px) edi → `h-16 flex items-center px-5` (64px) — topbar `h-16` bilan teng.
- **Seller** ([Sidebar.tsx](../seller/src/widgets/sidebar/Sidebar.tsx)): logo qutisi
  `px-5 py-[14px]` (60px) edi → `h-14 flex items-center px-5` (56px) — topbar `h-14` bilan teng.

Endi logo qutisi va topbar bir xil balandlik → bottom-border lar bir y-chiziqda
uchrashadi (L-burchak tekis).

### Kuryer nav padding
[layout.tsx](../courier/src/app/dashboard/layout.tsx): tab `px-3 py-2.5` konteyner
`py-2` ichida ortib ketardi → tab `px-3.5 py-2` (konteyner bilan muvofiq).

### Kuryer "Ish holati" toggle darhol saqlanadi
[profile/page.tsx](../courier/src/app/dashboard/profile/page.tsx): toggle faqat
lokal state'ni o'zgartirardi, "Saqlash" bosilmaguncha saqlanmasdi — toggle
ko'rinishi esa "darhol" degan taassurot berardi. Endi `toggleOnline()` faqat
`isOnline`ni darhol PATCH qiladi (boshqa tahrirlanmagan maydonlarni clobber
qilmaydi), optimistik, xatoda ortga qaytadi. `tsc --noEmit` toza.

## Keyingi bosqichlar (rejada)
2. Kuryer + admin panel chuqurroq polish (egasidan eng yomon ekranlar screenshot).
3. Nav unread badge — seller + kuryer (`data.link` bo'yicha guruhlash) + admin
   (unread polling + bell qo'shish).
4. O'lik funksiyalar — prompt()/confirm()/alert() → modal; admin "Sozlamalar".
5. i18n — uz / ru / krill (krill=transliteratsiya, ru=tarjima), 4 panelda.
