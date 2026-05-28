# Tipografiyani bir xillashtirish — Josefin Sans hamma panelda

**Sana:** 2026-05-25
**Tegishli:** [`DESIGN_SYSTEM.md` §3](../DESIGN_SYSTEM.md#3-tipografiya--josefin-sans)

`DESIGN_SYSTEM.md` ga ko'ra to'rt panel ham (admin / seller / courier / client)
**Josefin Sans** (variable, 300–700) shriftidan foydalanishi shart. Audit paytida
courier paneli hali eski Geist Sans + Geist Mono bilan qolgan edi — bu yagona
chetga chiqish edi. Shu hujjatda nima topildi va nima tuzatildi qayd etiladi.

## Maqsad

To'rtala panelda bitta vizual ohang: Josefin Sans (`next/font/google`), Tailwind
`font-sans` tokeni `--font-josefin` CSS o'zgaruvchisidan keladi, body `font-family`
shu tokenni o'qiydi.

## Auditdan nima topildi

| Panel | Layout shrifti | `--font-sans` manbai | Holat |
| --- | --- | --- | --- |
| `admin/` | Josefin Sans (variable) | `var(--font-josefin), system-ui, sans-serif` | ✅ Mos |
| `seller/` | Josefin Sans (variable) | `var(--font-josefin), system-ui, sans-serif` | ✅ Mos |
| `client/` | Josefin Sans (variable) | `var(--font-josefin), system-ui, sans-serif` | ✅ Mos (Telegram theme alohida) |
| `courier/` | Geist + Geist Mono | `var(--font-geist-sans)` | ❌ Tuzatildi |

## Tuzatish (courier)

**`courier/src/app/layout.tsx`** — Geist'lar olib tashlandi, Josefin Sans
boshqa panellardagi bilan bir xil pattern bilan import qilindi:

```tsx
import { Josefin_Sans } from "next/font/google";

const josefin = Josefin_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-josefin",
  display: "swap",
});

<html lang="uz" className={`${josefin.variable} h-full antialiased`}>
```

`metadata.icons = { icon: "/logo.png" }` ham qo'shildi (boshqa panellar bilan
moslik uchun).

**`courier/src/app/globals.css`** — `@theme` ichidagi font tokenlari yangilandi:

```css
@theme {
  /* … */
  --font-sans: var(--font-josefin), system-ui, sans-serif;
}

body {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

`--font-mono` butunlay olib tashlandi — courier panelda kod ko'rsatish yo'q,
keraksiz.

## Qanday tekshirildi

- `npx tsc --noEmit` toza (0 ta xato).
- `grep -r "geist\|font-mono" courier/src` — qoldiqlar yo'q.
- admin/seller/client `layout.tsx` va `globals.css` o'zgartirilmadi — ular
  allaqachon mos edi.

## Keyingi qadamlar

Courier paneli rang palitrasi hali eski sariq `bee-*` (`#FBC02D`) bilan ishlaydi —
admin/seller/client esa premium orange `brand-*` (`#F97316`). Bu **alohida task**:
courier panelni umumiy design system'ga to'liq olib o'tish (palitra + komponentlar).
Hozir faqat shrift normallashtirildi, qolgani keyingi sprint'da.
