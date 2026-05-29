# BeeExpress — Design System

> Yagona haqiqat manbai. Loyihada UI yozayotgan har bir kishi (yoki AI agent) shu hujjatga
> rioya qilishi shart. Bu yerdan chetga chiqish — tanlov emas, **regression**.
>
> File path: `/DESIGN_SYSTEM.md` (root). Har bir panel uchun `src/shared/ui/*` shu
> qoidalarni amalda qo'llaydi. Yangi sahifa qo'shganda **avval shu fayl o'qiladi**, keyin
> shared/ui dan komponent olinadi, faqat shundan keyin yozish boshlanadi.

## 1. Brend asoslari

- **Mahsulot:** BeeExpress — uch tomonlama marketplace + yetkazib berish.
- **Personality:** premium, sokin, ishonchli, mahalliy. Cluttered, "noisy" yoki "bolalarcha"
  ko'rinishdan qochiladi.
- **Logo:** `assets/logo.png` (loyihaning **assets/** papkasidagi original). Har bir panel
  build paytida uni `public/logo.png` ga ko'chiradi yoki shu yo'l bilan import qiladi.
  Eski "🐝 BeeExpress" emoji versiya o'chirildi.

## 2. Rang palitrasi

Tailwind v4 dagi `@theme` ichida quyidagi CSS custom property nomlari bilan e'lon qilingan.
Hech qachon hardcoded hex ishlatmang — har doim token nomidan foydalaning
(`bg-brand-500`, `text-ink`, `border-line` va h.k.).

### Primary — Premium orange

| Token | Hex | Maqsad |
| --- | --- | --- |
| `--color-brand-50` | `#FFF7ED` | super soft surface (banner background) |
| `--color-brand-100` | `#FFEDD5` | subtle hover, chip bg |
| `--color-brand-200` | `#FED7AA` | input focus ring (yumshoq) |
| `--color-brand-300` | `#FDBA74` | gradient stop, illustration |
| `--color-brand-400` | `#FB923C` | secondary CTA / hover |
| **`--color-brand-500`** | **`#F97316`** | **asosiy CTA, brand color** |
| `--color-brand-600` | `#EA580C` | active/pressed |
| `--color-brand-700` | `#C2410C` | text on light surfaces (kontrast) |
| `--color-brand-800` | `#9A3412` | deep |
| `--color-brand-900` | `#7C2D12` | ultra deep |

### Accent — Yellow-orange (faqat aksent uchun, asosiy emas)

| Token | Hex | Maqsad |
| --- | --- | --- |
| `--color-accent-300` | `#FCD34D` | highlight, "premium" rozetka |
| `--color-accent-400` | `#FBBF24` | star rating, success-warm |
| `--color-accent-500` | `#F59E0B` | warning / pending status |

### Neutrals — Soft dark/light

| Token | Hex | Maqsad |
| --- | --- | --- |
| `--color-ink` | `#0B0B0F` | asosiy matn (heading) |
| `--color-ink-soft` | `#27272A` | body text |
| `--color-ink-muted` | `#71717A` | hint, meta |
| `--color-ink-faint` | `#A1A1AA` | placeholder, divider label |
| `--color-line` | `#E4E4E7` | border default |
| `--color-line-soft` | `#F1F1F4` | divider, subtle |
| `--color-surface` | `#FFFFFF` | card / panel |
| `--color-surface-2` | `#FAFAF9` | page background (warm) |
| `--color-surface-3` | `#F5F5F4` | nested card / chip |

### Semantic

| Token | Hex |
| --- | --- |
| `--color-success` | `#16A34A` |
| `--color-warning` | `#F59E0B` |
| `--color-danger`  | `#DC2626` |
| `--color-info`    | `#0EA5E9` |

### Gradients (background uchun)

- `--gradient-warm`: `linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 45%, #FEF3C7 100%)`
  — login va hero sahifalar uchun yumshoq orange→cream→amber.
- `--gradient-soft`: `radial-gradient(at 0% 0%, #FFEDD5 0%, transparent 50%),
  radial-gradient(at 100% 0%, #FEF3C7 0%, transparent 45%)` — dashboard topbar.
- `--gradient-premium`: `linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FBBF24 100%)`
  — premium chip, banner CTA. Faqat **kichik** maydonlarda.

Page background **deyarli har doim** `--color-surface-2` + (ixtiyoriy) yuqori chap
burchakdagi soft radial gradient. Gradient hech qachon vsechelvek panelni
ifloslanmasin — opacity past, content kontrasti saqlansin.

## 3. Tipografiya — Inter

**Asosiy shrift:** [Inter](https://fonts.google.com/specimen/Inter)
(`next/font/google`). Variable, og'irliklar 100–900. Serius, minimal, OpenType
features bilan boy — dashboard va product UI uchun standart sanoat tanlovi
(Linear, Stripe, GitHub, Vercel — barchasi Inter ishlatadi).

```ts
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});
```

`<html className={inter.variable}>` qilib biriktiriladi. Tailwind `font-sans` token
`var(--font-inter)` ni o'qiydi.

### Type scale

| Token | Size / line-height | Tracking | Maqsad |
| --- | --- | --- | --- |
| `display` | 36 / 44 | -0.01em | hero, login title |
| `h1` | 28 / 36 | -0.005em | page title |
| `h2` | 22 / 30 | 0 | section title |
| `h3` | 18 / 26 | 0 | card title |
| `body` | 14 / 22 | 0.005em | default text |
| `small` | 13 / 20 | 0.01em | meta |
| `caption` | 11 / 16 | 0.04em uppercase | label, badge |

Weight: heading **600**, sub-heading **500**, body **400**, caption **500** uppercase.

> Inter neytral va yuqori-x-height. Heading uchun `tracking-tight` (-0.01em),
> body uchun `tracking-normal`. Dashboard'larda 700 cheki; 800-900 faqat
> hero/display uchun. Numerik ma'lumotda `font-feature-settings: "tnum"`
> ishlatish tavsiya etiladi (Inter `tabular-nums` ni qo'llab-quvvatlaydi).

## 4. Bo'shliq va o'lcham

- Spacing scale: Tailwind default (`0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24`).
- Kontent maxsimum eni: dashboard `max-w-screen-2xl`, marketing/landing `max-w-6xl`,
  mobile (client) — full width with `px-4`.
- Card/Panel padding: `p-6` (desktop), `p-4` (mobile).
- Section vertical gap: `gap-6` desktop, `gap-4` mobile.

### Radius

| Token | Value | Maqsad |
| --- | --- | --- |
| `rounded-sm` | 6px | chip, tag |
| `rounded-md` | 10px | input, button (default) |
| `rounded-lg` | 14px | small card |
| `rounded-xl` | 18px | card |
| `rounded-2xl` | 22px | hero panel |
| `rounded-full` | 9999px | avatar, pill |

### Soya (shadow)

- `shadow-card`: `0 1px 2px rgba(15,15,15,0.04), 0 0 0 1px rgba(15,15,15,0.04)`
  — default card.
- `shadow-pop`: `0 12px 32px -12px rgba(249,115,22,0.18), 0 4px 12px rgba(15,15,15,0.06)`
  — popover, modal, focused CTA.
- `shadow-none`: standart, flat surface uchun (premium feel).

Heavy box-shadow ishlatilmaydi. Loyiha "flat + 1px border + soft gradient" estetikasiga
amal qiladi.

## 5. Iconography — Lucide React

`lucide-react` paketi har bir panel `package.json` ida. Foydalanish qoidalari:

- **Size:** default `h-4 w-4` (inline), `h-5 w-5` (button), `h-6 w-6` (nav).
- **Stroke:** default 1.75; ko'p qatorli matnda 1.5.
- **Color:** `text-ink-muted` ohanglilar, `text-brand-500` faqat aktiv/qiziqarli.
- **Faqat semantik joyda:** nav, status, CTA, empty-state, form prefix. Dekorativ icon
  YOQ — har bir icon mazmunga xizmat qilsin.
- Import per-icon (tree-shake): `import { ShoppingBag } from "lucide-react"`.

## 6. Component poydevor

`src/shared/ui/` ichida quyidagi reusable building blocks bo'lishi shart. Ularning API si
har bir panelda **bir xil** bo'lsin (faqat ichki rang yoki shape mobile/desktop uchun
moslashishi mumkin).

| Component | Maqsad | Variants |
| --- | --- | --- |
| `Button` | barcha CTA | `primary` (brand-500), `secondary` (surface-3 + line), `ghost`, `outline`, `danger`; size `sm/md/lg`; `loading` |
| `IconButton` | icon-only | size `sm/md`; variant `ghost/solid` |
| `Input` | text input | `label`, `hint`, `error`, `leftSlot`, `rightSlot` |
| `Textarea` | multi-line | shu konventsiya |
| `Select` | native | Input bilan bir xil styling |
| `Checkbox`, `Switch` | toggle | brand-500 accent |
| `Card`, `CardHeader`, `CardBody`, `CardFooter`, `CardTitle`, `CardDescription` | konteyner | `tone="default"` / `"warm"` (gradient bg) |
| `Badge` | status chip | `tone: neutral / brand / success / warning / danger / info` |
| `Avatar` | user/store | size, initials fallback |
| `Logo` | brend logo | asset PNG, size optional, `withWordmark` opt-in |
| `Spinner` | loading | brand-500 |
| `Skeleton` | loading block | shimmer |
| `EmptyState` | bo'sh ro'yxat | icon + title + description + action slot |
| `Toast` | bildirishnoma | `success/warning/error/info` |
| `Modal`, `Drawer` | overlay | esc/outside-click yopish |
| `PageHeader` | sahifa sarlavhasi | title + description + actions slot |
| `StatCard` | KPI raqam | label + value + delta opt |

### Auth/RBAC primitives (`src/shared/auth/`)

| Item | Maqsad |
| --- | --- |
| `useAuthStore` | zustand persist (mavjud) |
| `api` | axios instance + refresh interceptor (mavjud) |
| `AuthBoundary` | route-level guard: hydrate kut, token yo'q bo'lsa `/login` ga redirect, `me` yo'q bo'lsa `/auth/me` chaqir |
| `RoleGuard` | `allowed?: ("super_admin" \| string)[]` ro'yxati; ruxsat yo'q bo'lsa fallback yoki redirect |
| `LogoutButton` | clear + logout API |

## 7. Layout namunalari

### 7.1. Desktop dashboard (admin, seller, courier)

```
+-----------------------------------------------------------+
| Sidebar (256px, surface, gradient overlay top)            |
|   Logo                                                    |
|   [Section]                                               |
|     • Nav item (icon + label)                             |
|     • Nav item                                            |
|   [Section]                                               |
|     • …                                                   |
|   ───                                                     |
|   User card + logout                                      |
+-----------------------------------------------------------+
| Topbar (64px, surface, border-bottom line, breadcrumbs    |
| left, command/search + user avatar right)                 |
+-----------------------------------------------------------+
| Page area (surface-2, p-8)                                |
|   PageHeader (title + actions)                            |
|   Content (cards, tables, forms)                          |
+-----------------------------------------------------------+
```

### 7.2. Mobile customer (client / Telegram Mini App)

```
+-----------------------------------------------+
| Topbar (sticky, surface, brand wordmark + 1   |
| icon-action, e.g. cart)                       |
+-----------------------------------------------+
| Content (px-4 py-3, gradient-warm background  |
| at top)                                        |
+-----------------------------------------------+
| Bottom tab nav (Home / Search / Orders /      |
| Profile) — 64px, sticky, surface              |
+-----------------------------------------------+
```

## 8. Holatlar (loading / empty / error)

**Hech qachon "Yuklanmoqda…" tekst bilan cheklanmang.** Har sahifada uchta holat oldindan
o'ylangan bo'lsin:

- **Loading:** kontent skeletoni (Skeleton kompozitsiyasi) yoki Spinner + label.
- **Empty:** `EmptyState` komponenti — semantik icon, qisqa sarlavha, tushuntirish, harakat
  tugmasi.
- **Error:** "danger" tonli ogohlantirish — sabab + qayta urinish tugmasi.

Forma ichida `error` o'rnida joylashgan input + qisqa xabar ostida.

## 9. Animatsiyalar

- Default transition: `transition-colors duration-150 ease-out`.
- Hover scale yo'q (premium uchun). Buning o'rniga rang/border o'zgaradi.
- Modal/drawer kirish: `transition-opacity duration-200` + `transition-transform`.
- Skeleton shimmer: 1.4s linear infinite.

Reduced motion respect qilinadi — `prefers-reduced-motion: reduce` da animation o'chadi.

## 10. Til va lokal

- Asosiy interfeys tili: **o'zbek (lotin)**.
- Sana/raqamlar `Intl` API orqali (`uz-UZ`).
- Pul birligi: `so'm`. Misol: `12 500 so'm`.
- Telefon ko'rinishi: `+998 99 341 17 86`.
- Heading va tugma matni har doim Bosh harf bilan boshlanadi (sentence case), CAPS LOCK
  yo'q (faqat `caption` token).

## 11. Accessibility — minimum

- Kontrast: matn `≥ 4.5:1`, katta heading `≥ 3:1`.
- Focus ring har joyda ko'rinadi (`focus-visible:ring-2 ring-brand-200`).
- Form input bilan label har doim bog'langan (`label htmlFor`).
- Icon-only tugmada `aria-label`.
- Modal `role="dialog"` + esc bilan yopiladi.

## 12. Yo'q qilingan ("don'ts")

- Bee emoji 🐝 logo o'rnida. **Faqat `assets/logo.png`.**
- Heavy shadow (3-4 qatorli, qora). Bizniki yumshoq, orange-tinted.
- 8 dan ko'p rangli rang palitrasi. Brand + accent + neutral + 4 ta semantik — bo'ldi.
- Dekorativ emoji yoki sticker (mahsulot rasmi va kategoriya iconi bundan mustasno).
- Tailwind ichidagi hardcoded hex (`text-[#ff0000]`). Token ishlat.
- Inline `style={{ color: "…" }}` ranglar uchun.
- Mobile layoutda gorizontal scroll.

## 13. Faylda joylashish

Har bir panel (`admin/`, `client/`, `seller/`, `courier/`) FSD layeri bilan quriladi:

```
src/
  app/                # Next.js app router — faqat route fayllar
  shared/
    ui/               # komponentlar (Button, Input, Card, …)
    auth/             # auth-store, api, AuthBoundary, RoleGuard
    lib/              # cn, format, hooks (useDebounce, …)
    config/           # env, routes, nav
    icons/            # logo, custom svg (agar kerak)
  entities/           # domain (user, order, category, product, …)
  features/           # use-case lar (login-form, role-switcher, product-create, …)
  widgets/            # layout pieces (Sidebar, Topbar, BottomNav, …)
```

Sahifa fayl ichida **biznes logikasi yozilmaydi** — u faqat composition (widgets +
features). Logikani features/ ga olib chiq.

## 14. Bu hujjatni yangilash

Yangi UI primitive qo'shilsa yoki rang/token o'zgartirilsa — birinchi bo'lib **shu fayl
yangilanadi**, keyin kod. PR opisaniyesida `DESIGN_SYSTEM.md` ga havola bo'lsin.
