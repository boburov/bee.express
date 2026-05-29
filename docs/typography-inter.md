# Tipografiya — Inter (Plus Jakarta Sans o'rniga)

**Sana:** 2026-05-28
**Tegishli:** [`DESIGN_SYSTEM.md` §3](../DESIGN_SYSTEM.md#3-tipografiya--inter),
[`typography-plus-jakarta.md`](./typography-plus-jakarta.md)

To'rtala panel (admin / seller / courier / client) asosiy shrifti **Plus
Jakarta Sans**'dan **Inter**'ga o'tkazildi. Sabab: dashboard/marketplace UI
uchun **serius, minimalist va neytral** ko'rinish kerak edi. Inter sanoat
standarti (Linear, Stripe, GitHub, Vercel ham shunday).

## O'zgartirilgan fayllar

To'rt panelda bir xil pattern:

```tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

<html className={`${inter.variable} h-full antialiased`}>
```

```css
@theme {
  --font-sans: var(--font-inter), system-ui, sans-serif;
}
```

- `admin/src/app/layout.tsx` + `globals.css`
- `seller/src/app/layout.tsx` + `globals.css`
- `courier/src/app/layout.tsx` + `globals.css`
- `client/src/app/layout.tsx` + `globals.css`
- `DESIGN_SYSTEM.md` §3 — yangi shrift bilan yangilandi
- `memory/reference_design_system.md` — yangilandi

## Nima o'zgardi

| | Plus Jakarta Sans | Inter |
| --- | --- | --- |
| Weights | 200–800 | 100–900 |
| Tovush | Geometric, do'stona | Neutral, serius, OpenType-rich |
| Tabular nums | Yo'q (default) | Bor (`tabular-nums`) |
| Variable CSS | `--font-jakarta` | `--font-inter` |
| Sanoat ishlatish | Plus Jakarta startup'lar | Linear, Stripe, GitHub, Vercel |

CSS variable nomi `--font-jakarta` → `--font-inter` ga o'zgardi. Komponent'lar
`font-sans` Tailwind tokeni orqali yangi shriftni avtomatik oladi.

## Tavsiyalar

- Heading: `font-semibold tracking-tight` (Inter -0.01em tracking yaxshi yumshatadi)
- Body: `font-normal tracking-normal`
- Numerik ma'lumotda (narx, sana, statistika): `tabular-nums` class qo'shing —
  raqamlar bir xil kenglikda chiziladi.
  ```tsx
  <span className="tabular-nums">12 500 so'm</span>
  ```
- Dashboard'larda 700 cheki (oldingidek), 800-900 faqat hero/display.

## Qanday tekshirildi

- `grep "jakarta\|Jakarta" {admin,seller,courier,client}/src` — qoldiqlar yo'q
- `tsc --noEmit` to'rt panel uchun toza
- Visual: keyingi sprint'da (hozir RAM tejash uchun o'tkazildi)
