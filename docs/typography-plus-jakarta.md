# Tipografiya — Plus Jakarta Sans (Josefin Sans o'rniga)

**Sana:** 2026-05-28
**Tegishli:** [`DESIGN_SYSTEM.md` §3](../DESIGN_SYSTEM.md#3-tipografiya--plus-jakarta-sans),
[`typography-unify.md`](./typography-unify.md)

To'rtala panel (admin / seller / courier / client) asosiy shrifti **Josefin Sans**
dan **Plus Jakarta Sans** ga o'tkazildi. Plus Jakarta Sans modern, geometric va
neytral — dashboard va marketplace UI uchun Josefin Sans'ga qaraganda ko'proq mos
keladi (Josefin tabiatan baland va dekorativ).

## Nima o'zgardi

| Panel | Eski shrift | Yangi shrift | Variable |
| --- | --- | --- | --- |
| `admin/` | Josefin Sans | Plus Jakarta Sans | `--font-jakarta` |
| `seller/` | Josefin Sans | Plus Jakarta Sans | `--font-jakarta` |
| `courier/` | Josefin Sans | Plus Jakarta Sans | `--font-jakarta` |
| `client/` | Josefin Sans | Plus Jakarta Sans | `--font-jakarta` |

CSS variable nomi `--font-josefin` → `--font-jakarta` ga o'zgardi. Tailwind
`font-sans` tokeni shu yangi variable'ni o'qiydi — komponent darajasidagi kodga
tegmadik (`font-sans`, `font-semibold` kabi util'lar avtomatik yangi shriftda
ko'rinadi).

## Layout pattern (har bir panelda bir xil)

```tsx
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jakarta",
  display: "swap",
});

<html lang="uz" className={`${jakarta.variable} h-full antialiased`}>
```

## CSS theme token

```css
@theme {
  /* … */
  --font-sans: var(--font-jakarta), system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
}
```

## O'zgartirilgan fayllar

- `admin/src/app/layout.tsx` + `admin/src/app/globals.css`
- `seller/src/app/layout.tsx` + `seller/src/app/globals.css`
- `courier/src/app/layout.tsx` + `courier/src/app/globals.css`
- `client/src/app/layout.tsx` + `client/src/app/globals.css`
- `DESIGN_SYSTEM.md` §3 — yangi shrift bilan yangilandi.

## Qanday tekshirildi

- `grep -r "josefin\|Josefin" {admin,seller,courier,client}/src` — qoldiqlar yo'q.
- `npx tsc --noEmit` to'rtala panel uchun toza (faqat Next.js'ning generat
  qilgan `.next/dev/types/validator.ts` failini hisobga olmaganda — uni biz
  yaratmadik va keshlangan).

## Plus Jakarta Sans haqida

- Google Fonts'da variable shrift, og'irliklar **200–800** (Josefin 300–700 edi).
- Latin + Latin Extended subset'larini qo'llaydi (o'zbek lotin diakritikasi uchun).
- Heading da `tracking-tight`, body da `tracking-normal` ishlatish tavsiya etiladi.
- 800 vazn faqat hero/display uchun; dashboard'larda 700 cheki saqlanadi
  (`DESIGN_SYSTEM.md` da yangilangan eslatma).

## Keyingi qadamlar yo'q

Bu task faqat asosiy shrift tokenini almashtirdi — type scale, weight bo'sh
qoidalari, spacing, palitra hammasi o'zgarmadi. Komponentlar `font-sans` orqali
yangi shriftni avtomatik oladi, alohida migratsiya kerak emas.
