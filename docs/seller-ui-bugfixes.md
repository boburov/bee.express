# Seller (va umumiy) UI bug tuzatishlari

> Seller panel screenshotlari asosida topilgan va tuzatilgan ko'rinadigan/funksional
> buglar. Aniqlangach, xuddi shu bug klassi boshqa panellarda ham tuzatildi.

## 1. Formatlanmagan telefon ("+200020446")

**Muammo:** Telefon raqami `+${me.phone}` ko'rinishida raw ko'rsatilardi —
`200020446` (9 xonali, 998'siz) → ekranda **"+200020446"**. Bu seller dashboard
salomida ("Xush kelibsiz, …") va sidebar foydalanuvchi kartasida ko'rinardi.

**Tuzatildi** (`formatPhone` → `+998 20 002 04 46`):
- `seller/src/app/dashboard/page.tsx` — salom matni
- `seller/src/widgets/sidebar/Sidebar.tsx` — sidebar user kartasi
- `client/src/app/(panel)/home/page.tsx` — salom matni (bir xil bug)
- `client/src/widgets/sidebar/Sidebar.tsx` — sidebar (bir xil bug)
- `client/src/shared/lib/format.ts` — `formatPhone` helperi qo'shildi (client'da yo'q edi)

> `??` o'rniga `||` ishlatildi — `firstName` bo'sh satr ("") bo'lsa ham telefon/fallback
> ishlashi uchun.

## 2. Tarjima qilinmagan enum ("ACTIVE")

**Muammo:** Do'kon status banneri raw enum'ni ko'rsatardi —
`<Badge>{store.status}</Badge>` → **"ACTIVE"** (inglizcha, sarlavha "Do'kon faol" bilan
takror). Design system §10 interfeys tili o'zbekcha bo'lishini talab qiladi.

**Tuzatildi:** `seller/src/features/store/StatusBanner.tsx` — har bir holatga
lokalizatsiya qilingan `statusLabel` qo'shildi:
`PENDING → Kutilmoqda`, `ACTIVE → Faol`, `REJECTED → Rad etilgan`,
`SUSPENDED → To'xtatilgan`, default → `Noma'lum`.

## 3. Buzilgan `tel:` linklari (noto'g'ri raqam terardi)

**Muammo:** Qo'ng'iroq linklari `tel:+${phone}` ko'rinishida `998` siz qurilardi —
9 xonali raqam uchun `tel:+200020446` (noto'g'ri, terilmaydi). Panellar bo'ylab
nomuvofiq edi (ba'zi joyda `+998${phone}`, ba'zida `+${phone}`).

**Tuzatildi** (`tel:+998${String(phone).slice(-9)}` — 9 yoki 12 xonali bo'lsa ham to'g'ri):
- `seller/src/app/dashboard/orders/[id]/page.tsx` — kuryer + xaridor (2 ta)
- `client/src/app/(panel)/orders/[id]/page.tsx` — do'kon
- `courier/src/app/dashboard/deliveries/[id]/page.tsx` — xaridor

## Tasdiqlash

`npx tsc --noEmit` — **seller, client, courier** uchun toza o'tdi (exit 0).
