# Client panel — Desktop responsive

> Client (Telegram Mini App) panelini **desktop** uchun ham moslash. Mobil
> tajriba (Telegram ichidagi ko'rinish) **piksel-aniqlikda o'zgarmagan** —
> barcha desktop xatti-harakat faqat `lg` (≥1024px) breakpointdan boshlanadi.
> DESIGN_SYSTEM.md §7.1 (desktop dashboard) namunasiga rioya qiladi.

## Maqsad

Avval client panel faqat mobil edi: butun kontent `max-w-md` (~448px) ga
qisilgan, desktop brauzerda ekranning o'rtasida ingichka ustun bo'lib qolardi.
Endi `lg+` da to'liq dashboard layout: chap **Sidebar** + kengroq kontent
maydoni. Telegram Mini App mobil ko'rinishi o'zgarmaydi.

## Bitta breakpoint — `lg` (1024px)

Hamma narsa bitta nuqtada almashadi (admin panel bilan bir xil):

| Element | `< lg` (mobil) | `lg+` (desktop) |
| --- | --- | --- |
| Navigatsiya | BottomNav (pastki tab bar) | Sidebar (chap, 256px) |
| Topbar | Logo + cart | Logo yashirin (Sidebar'da), Manzil + cart |
| Kontent eni | `max-w-md` | `max-w-5xl` (ro'yxat/forma sahifalar markazda torroq) |
| Grid ustunlar | `grid-cols-2` | `lg:grid-cols-4` / `xl:grid-cols-5` |

> ⚠️ **Muhim:** grid ustunlar va eng-kenglik faqat `lg:`/`xl:` bilan o'zgaradi,
> `sm:`/`md:` emas. Sababi: kontent eni `lg` gacha `max-w-md` (448px) da qoladi,
> shu sababli `sm:`/`md:` grid variantlari 448px ichiga ortiqcha ustun
> tiqishtirib yuborardi. Layout `lg` da kengayadi → ustunlar ham `lg` da ko'payadi.

## O'zgargan / yangi fayllar

### Yangi
- **`widgets/sidebar/Sidebar.tsx`** — desktop-only chap rail (`hidden lg:flex`,
  `lg:sticky lg:top-0 lg:h-screen`). Logo header (h-16 ga teng, topbar bilan
  chegaralari tekis) → `customerNav` (Asosiy/Katalog/Buyurtmalar/Profil) +
  badge'li **Savat** havolasi → user card + `LogoutButton`. Uslubi admin
  sidebar bilan bir xil.
- **`widgets/app-shell/AppShell.tsx`** — eski `mobile-shell/MobileShell.tsx`
  o'rnini bosadi (nomi endi to'g'ri: mobil + desktop). `lg:flex` bilan
  Sidebar + kontent ustuni.

### O'zgargan
- **`app/(panel)/layout.tsx`** — `MobileShell` → `AppShell`.
- **`widgets/topbar/Topbar.tsx`** — `max-w-md lg:max-w-none`, `h-14 lg:h-16`,
  `px-4 lg:px-8`. Logo `lg:hidden` (Sidebar'da bor). "Manzil yo'q" havolasi
  endi chapda va `lg:inline-flex` bilan **desktop'da ko'rinadi** (ilgari
  `xs:` ishlatilgan edi — Tailwind v4'da `xs` yo'q, ya'ni umuman ko'rinmasdi).
- **`widgets/bottom-nav/BottomNav.tsx`** — `lg:hidden`.
- **Grid sahifalar** (`home`, `catalog`, `c/[slug]`) — desktop'da ko'proq ustun.
- **Ro'yxat/forma sahifalar** (`cart`, `checkout`, `profile` → `lg:max-w-2xl`;
  `orders` → `lg:max-w-3xl`) — `lg:mx-auto` bilan markazda, o'qilishi qulay enda.
- **`p/[slug]` (mahsulot tafsiloti)** — desktop'da **2 ustun**:
  `lg:grid lg:grid-cols-2`. Chap ustun galereya (`lg:sticky lg:top-20`), o'ng
  ustun sarlavha/variant/sotuvchilar/tafsilot. "Savatga qo'shish" paneli
  mobilda `sticky bottom-16` (bottom-nav ustida), desktop'da `lg:static`
  (o'ng ustun oxirida oddiy oqimda).

### O'chirilgan
- `widgets/mobile-shell/` (AppShell'ga ko'chdi).

## Tekshiruv

- `npx tsc --noEmit` — toza (exit 0).
- `npm run build` — 14 sahifa muvaffaqiyatli, Tailwind kompilyatsiya bo'ldi.
- ESLint (yangi/o'zgargan widgetlar) — toza. Sahifalardagi mavjud lint
  ogohlantirishlari (apostrof escape, effect setState, `orders`'dagi
  ishlatilmagan `Card` import) bu task'dan oldin ham bor edi, tegilmagan.

## Eslatma

- Sidebar va BottomNav bir xil `customerNav` config'idan oziqlanadi; Savat
  faqat Sidebar'ga qo'shimcha qilingan (mobilda u Topbar'da turadi).
- Kelajakda: desktop topbar'ga real qidiruv (search wired bo'lganda) va
  mahsulot tafsilotida real geo/manzil tanlash qo'shilsa, shu layout'ga sig'adi.
