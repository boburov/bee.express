# Client (Mini App) — Design refresh (2026-05-25)

Mini App sahifalari admin paneli premium estetikasiga moslashtirildi. **Hech qanday
emoji ishlatilmaydi** — barchasi Lucide ikonlar va brand-tone'li chip'lar bilan.

## Maqsad

Foydalanuvchi bergan brief:

> "admin panelni desigini yaxhsi ekan huddi shu desigin bilan client panelni ham
> improve qilib bering, emoji ishlatmang orniga icon yoki svg icon ishlating"

Premium orange dizayn tizimi `DESIGN_SYSTEM.md` allaqachon mavjud edi. Bu sprint:

1. Mavjud emoji'lar (🍔🛒🧱🍎) Lucide ikonlariga almashtirildi.
2. Admin paneldagi shared UI ideylari client'ga ko'chirildi (Avatar, IconTile).
3. Layout chrome (topbar, bottom nav) jilolandi.
4. Empty state'lar CTA bilan boyitildi.

## Yangi shared UI

| Komponent | Joylashuv | Maqsad |
| --- | --- | --- |
| `Avatar` | `client/src/shared/ui/Avatar.tsx` | Initials fallback bilan rasm. Admin'dagi bilan bir xil — premium orange gradient. |
| `IconTile` | `client/src/shared/ui/IconTile.tsx` | Lucide ikon + label + caption bilan rangli kategoriya kartochkasi. 6 ta tone: `brand / amber / emerald / sky / rose / violet`. |

`IconTile` markazda turadi — bu **emoji o'rniga ishlatiladigan** rangli chip.
Har bir tone Tailwind'ning built-in palette'idan (50/100/700) — brand token'larni
dekorativ ranglar bilan ifloslantirmaslik uchun.

## Sahifa-sahifa o'zgarishlar

### `/login`

- Logo + ostida "platforma haqida" subtitle.
- `<PhoneOtpForm />` (allaqachon premium).
- **Yangi:** 3-ustunli "trust strip" — `Store / Truck / Sparkles` ikonlar bilan
  ("Yaqin sotuvchilar", "Tez yetkazib berish", "Naqd to'lov"). `bg-surface/70
  backdrop-blur` orqali gradient ustida nozik ko'rinadi.
- Botga `/start` qoldiqi.

### `/home`

**Eskisi:**
```tsx
const categories = [
  { slug: "food",  label: "Ovqat",    emoji: "🍔" },
  { slug: "grocery", label: "Mahsulot", emoji: "🛒" },
  ...
];
```

**Yangisi:**
```tsx
const categories = [
  { slug: "food",  label: "Ovqat", icon: UtensilsCrossed, tone: "rose"    },
  { slug: "grocery", label: "Mahsulot", icon: ShoppingBasket, tone: "emerald" },
  { slug: "fruits",  label: "Mevalar",  icon: Apple,          tone: "amber"   },
  { slug: "construction", label: "Qurilish", icon: HardHat,   tone: "sky"     },
];
```

Tarkibi:
- Hero greeting card (gradient-warm + gradient-soft overlay) — Sparkles badge,
  ism, "katalog yoki qidiruv" CTA, manzil holati.
- `<IconTile>` grid (2 ustun) — har bir kategoriya o'zining tone'ida.
- Quick facts strip — 3-ustunli (Store / Truck / Sparkles) brand-50 chip'lar.
- Nearby stores placeholder — dashed border card, manzil qo'shishga CTA.

### `/catalog`

- Sticky search input (`/catalog/search` ga link).
- "Barcha kategoriyalar" — home bilan bir xil `IconTile` grid, lekin caption
  uzunroq ("Restoranlar va oshxonalar").
- Pastida tushuntirish satri.

### `/cart`

- `EmptyState` + ikon `ShoppingBag` (oldin `ShoppingCart` topbar bilan
  takrorlanardi).
- CTA tugma: **"Katalogni ochish"** (`/catalog` ga link).

### `/orders`

- `EmptyState` + `PackageSearch` ikon.
- CTA tugma: **"Buyurtma boshlash"** (`/catalog` ga link).

### `/profile`

- **Identity card (`tone="warm"`)** — `Avatar size={56}`, ism, telefon (formatlangan
  `+998 99 341 17 86`), rol va Telegram badge'lari.
- **Stat row** — 3 ta kichik kartochka: Buyurtmalar / Faol / Reyting (hozir 0/0/—,
  buyurtma moduli ulanganda real ma'lumot).
- **Settings list** — 5 ta qator (Manzillar, Bildirishnomalar, Til, Maxfiylik,
  Yordam) — har biri ikonli, hint matn va `ChevronRight` bilan.
- **Logout** — full-width quiet button (CTA emas — premium UX).

## Layout chrome

### Topbar (`widgets/topbar/Topbar.tsx`)

- `cartCount` prop qo'shildi — `0` bo'lsa badge yo'q, aks holda brand-500 dot.
- Subtle warm gradient overlay (`bg-gradient-soft opacity-50`) — admin sidebar
  bilan vizual mos.
- Logo (kichikroq 28px) + (opsional desktop'da) manzil tugma + savat ikon.

### Bottom nav (`widgets/bottom-nav/BottomNav.tsx`)

- Active item ostida **brand-50 pill** (8h × 12w rounded-full).
- Active ikon `text-brand-600` + `strokeWidth=2`; nofaol `text-ink-muted`
  `strokeWidth=1.75`.
- Padding biroz kamaytirildi (2.5 → 2) — pill kompakt ko'rinishi uchun.

## Texnik talablar

- Tailwind v4 token'larigina (no hex). Brand uchun `brand-*`, dekorativ uchun
  Tailwind built-in palette (`amber-50/100/700`, `emerald-*`, `sky-*`, `rose-*`,
  `violet-*`).
- Hech qanday emoji (`🍔🛒🧱🍎` butunlay olib tashlandi).
- Faqat Lucide ikonlar — `import { ... } from "lucide-react"`.
- Sentence case (CAPS yo'q). Pul `12 500 so'm`. Telefon `+998 99 341 17 86`.
- Telegram safe-area `padding-bottom: env(safe-area-inset-bottom)` saqlangan.

## Build

```
✓ Compiled successfully in 8.4s
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /cart
├ ○ /catalog
├ ○ /home
├ ○ /login
├ ○ /orders
└ ○ /profile
```

## Keyingi qadamlar

- [ ] `/catalog/[slug]` — kategoriya ichki sahifasi (sotuvchilar list).
- [ ] `/store/[slug]` — sotuvchi profili + menu.
- [ ] `/product/[slug]` — mahsulot tafsiloti + variant tanlash.
- [ ] Real cart state (zustand store) + topbar `cartCount` ulanishi.
- [ ] `/profile` Stat row real ma'lumot bilan ulanishi (buyurtma soni, faol, reyting).
