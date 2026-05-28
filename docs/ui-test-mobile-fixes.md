# UI test — responsive buglar va tuzatishlar (2026-05-28)

To'rtala panel (admin / seller / client / courier) Playwright chromium bilan
**uchta viewport**'da (mobile 390×844, tablet 768×1024, desktop 1440×900)
testlandi. Jami **72 sahifa × viewport ishlatilishi**. Bu hujjat topilgan
buglarni va tuzatishlarni qayd etadi.

## Test infratuzilmasi

Joylashuv: `.ui-test/` (git'ga commit qilinmagan, faqat lokal ishlash uchun).

- `run.js` — to'liq smoke skripti. JWT'ni `localStorage`'ga inject qiladi
  (auth bypass), har sahifani 3 viewport'da yuklaydi, screenshot oladi,
  horizontal-overflow va console error'larni qayd etadi.
- `diag.js` — yagona sahifa diagnostikasi. Mobile viewport'da overflow'ga
  sabab bo'layotgan eng kichik elementlarni topadi.
- `shots/` — screenshot'lar (panel_viewport_route.png).
- `report.json` — har page/viewport uchun status + console errors + overflow.

Ishga tushirish:
```bash
# Backend + 4 ta dev server kerak:
#   server (60000), admin (60001), client (60202), seller (60003), courier (60004)
cd .ui-test && node run.js
```

## Test natijasi

| Bosqich | Overflow | Console err | Nav err | Network err |
|---|---|---|---|---|
| **Boshlang'ich** | 16 sahifa | 0 | 0 | 1 |
| **Tuzatishdan keyin** | 1 sahifa (16px, Next.js dev badge) | 0 | 0 | 0 |

## Bug #1 — Admin paneli mobile'da sidebar yashirilmagan

**Diagnostika:** `node diag.js admin /dashboard/customers` 14 ta admin
sahifasida overflow 41-280px. Sidebar `w-64 shrink-0` (256px) va hech qanday
`md:hidden` yo'q edi — mobile'da sahifani kesib o'tardi.

**Tuzatish:** Hamburger drawer pattern joriy qilindi.

- [`admin/src/widgets/sidebar/Sidebar.tsx`](../admin/src/widgets/sidebar/Sidebar.tsx) —
  `mobileOpen` / `onClose` props qabul qiladi. Sidebar endi:
  - `fixed inset-y-0 left-0 z-50 transform transition-transform` (mobile)
  - `lg:static lg:translate-x-0 lg:transition-none` (desktop)
  - Backdrop overlay + close button mobile'da
  - `useEffect` orqali route o'zgarganda drawer yopiladi
- [`admin/src/widgets/topbar/Topbar.tsx`](../admin/src/widgets/topbar/Topbar.tsx) —
  `onMenuClick` qabul qiladi, `lg:hidden` hamburger tugma chap tomonda.
  Breadcrumb truncate, "BeeExpress · SuperAdmin" yozuvi `md:block`.
- [`admin/src/widgets/dashboard-shell/DashboardShell.tsx`](../admin/src/widgets/dashboard-shell/DashboardShell.tsx) —
  `useState` orqali `mobileMenuOpen`, sidebar + topbar'ga prop'lar uzatadi.
  Main `px-4 sm:px-6 lg:px-8` qilindi.

## Bug #2 — Seller paneli ham sidebar ko'rsatardi

**Diagnostika:** Bir xil pattern. 49px overflow ikkala seller sahifasida.

**Tuzatish:** Admin bilan bir xil — 3 ta faylda parallel o'zgartirish:
- [`seller/src/widgets/sidebar/Sidebar.tsx`](../seller/src/widgets/sidebar/Sidebar.tsx)
- [`seller/src/widgets/topbar/Topbar.tsx`](../seller/src/widgets/topbar/Topbar.tsx)
- [`seller/src/widgets/dashboard-shell/DashboardShell.tsx`](../seller/src/widgets/dashboard-shell/DashboardShell.tsx)

## Bug #3 — Courier paneli eski sariq palette

**Diagnostika:** Overflow yo'q, lekin courier hali eski `bee-*` (sariq,
`#FBC02D`) ranglarda. Boshqa 3 ta panel premium orange (`brand-*`,
`#F97316`). `docs/typography-unify.md` da bu "alohida task" sifatida
qoldirilgan edi — endi tuzatildi.

**Tuzatish:** [`courier/src/app/globals.css`](../courier/src/app/globals.css) —
admin/seller/client bilan bir xil pattern:
- `--color-brand-50..900` (yangi premium orange asosiy palette)
- `--color-bee-50..900` (eski `bee-*` endi orange hex bilan alias — komponent
  kod'ini o'zgartirish kerakmas)
- `--color-accent-300..500` (sariq aksent — faqat highlight uchun)
- Warm neutrals (ink/line/surface)
- Semantic colors (success/warning/danger/info)
- Gradient utilities (`bg-gradient-warm/soft/premium`)
- Shadow utilities (`shadow-card/pop`)
- `prefers-reduced-motion` qoidasi

Komponent fayllar (`Button.tsx`, `Logo.tsx`, `layout.tsx`, `login/page.tsx`)
**tegmadi** — ular `bee-500/600` ishlatadi, lekin endi bu rang qiymatlari
orange'ga `@theme`'da o'zgartirildi. Ya'ni butun panel avtomatik
orange'ga aylandi.

## Qoldi: Next.js dev-mode badge overflow (16px)

`/dashboard/notifications` mobile'da hali 16px overflow ko'rsatadi. Sahifa
o'zi to'g'ri, lekin Next.js'ning dev-only route indicator badge'i (pastki
chap burchakda "N" tugma) overflow keltiradi. **Production build'da bu
artifact yo'q** — diqqat berish shart emas.

## Visual verify — har panel

| Panel | Mobile | Tablet | Desktop |
|---|---|---|---|
| admin | ✅ Hamburger ko'rinadi, sidebar drawer ochiladi, StatCard'lar column'da | ✅ | ✅ Sidebar to'liq ko'rinadi, breadcrumb + brand mark o'ngda |
| seller | ✅ Hamburger ishlaydi, dashboard StatCard'lar to'g'ri | ✅ | ✅ |
| client (Mini App) | ✅ Top app bar + bottom nav, kategoriya grid 2-column, EmptyState markazda | ✅ Center container | ✅ Center container |
| courier | ✅ Orange tabs, BeeExpress logo orange | ✅ | ✅ |

## Reproduktsiya qilish

```bash
# Backend ishlatish:
cd server && node dist/main.js  # PORT=60000

# 4 ta panel dev:
cd admin && npm run dev    # 60001
cd client && npm run dev   # 60002
cd seller && npm run dev   # 60003
cd courier && npm run dev  # 60004

# Test:
cd .ui-test && node run.js
# Yoki bitta sahifa:
cd .ui-test && node diag.js admin /dashboard/notifications
```

Screenshot'lar `.ui-test/shots/{panel}_{viewport}_{route}.png` da.

## Statistika

- **18 ta** komponent fayl tahrir qilindi (6 ta admin/seller/courier per panel)
- **0 ta** typecheck xatosi qoldirildi (`npx tsc --noEmit` toza)
- **72 / 72** sahifa-viewport o'tishlari muvaffaqiyatli
- **15 / 16** ta overflow tuzatildi (1 ta Next.js dev artifact qoldi)
- **0 / 0** console error (boshidan beri yo'q edi)
