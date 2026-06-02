# UI tekislash (consistency pass) — v1

> Maqsad: to'rt panel (client, seller, courier, admin) UI'sini DESIGN_SYSTEM.md ga
> nisbatan **user-friendly va bir xil** qilish. Avval har panel parallel audit qilindi
> (mobil/responsive, design-system'ga moslik, UX holatlari, layout/spacing), keyin eng
> yuqori ta'sirli **systemic** muammolar tuzatildi.

## Bajarilgan ishlar (v1)

### 1. Courier panelini `brand-*` ga birlashtirish (eng katta nomuvofiqlik)

Courier o'zining legacy `bee-*` token aliasini va `text-ink` (qora matnli) primary
tugmasini ishlatardi — qolgan 3 panel `brand-*` + `text-white` ishlatadi. Endi
to'liq moslandi:

- `courier/src/app/globals.css` — legacy `--color-bee-*` alias bloki o'chirildi.
- `courier/src/components/ui/Button.tsx` — primary `bg-brand-500 text-white shadow-card`,
  ring `brand-200`, radius `rounded-md`, danger `bg-danger`, spinner `border-current`
  (seller Button bilan bir xil).
- `courier/src/components/ui/Input.tsx` — focus `brand-500/brand-200`, error holati
  `border-danger` + `text-danger` (hardcoded `red-500/red-600` o'rniga).
- `courier/src/app/dashboard/layout.tsx` — avatar `bg-brand-100 text-brand-700`
  (qora doira o'rniga), aktiv nav `bg-brand-500 text-white`, nav touch-target
  `py-1.5 → py-2.5` (telefon uchun qulay).
- `courier/src/app/{dashboard,login,apply,dashboard/profile,dashboard/deliveries/[id]}`
  — barcha `bee-*` rang klasslari `brand-*` ga ko'chirildi.

> Eslatma: `bee-courier-auth` (localStorage kaliti) **o'zgartirilmadi** — u rang emas.

### 2. `PageHeader` responsive (admin + seller barcha sahifasiga ta'sir)

`admin/src/shared/ui/PageHeader.tsx` va `seller/src/shared/ui/PageHeader.tsx`:
`flex items-start justify-between` → mobil'da sarlavha va tugmalarni siqib qo'yardi.
Endi `flex flex-col gap-3 sm:flex-row …` — mobil'da ustun, desktop'da qator; action
slot `flex-wrap` bilan. Bu PageHeader ishlatadigan **har bir sahifani** bir vaqtda
tuzatadi.

### 3. Layout/spacing — `gap-6` standartlashtirish (DESIGN_SYSTEM §4)

- `admin/src/app/dashboard/page.tsx` va `seller/src/app/dashboard/page.tsx`:
  root `gap-8 → gap-6`.
- `seller/src/app/dashboard/orders/page.tsx`: root `gap-5 → gap-6`.

### 4. UX holatlari — `ErrorState` primitivi + retry (DESIGN_SYSTEM §8)

Design system §8 error holatini ("danger tonli ogohlantirish + qayta urinish tugmasi")
talab qiladi, lekin shared primitiv yo'q edi. Qo'shildi:

- `seller/src/shared/ui/ErrorState.tsx` va `admin/src/shared/ui/ErrorState.tsx` —
  `EmptyState` bilan bir xil kompozitsiya, `danger` token, `role="alert"`,
  `onRetry` tugmasi.
- Ulandi:
  - `admin/src/features/orders/orders-list/OrdersList.tsx` — plain text error
    o'rniga `ErrorState onRetry={refresh}`.
  - `seller/src/app/dashboard/orders/page.tsx` — plain text error o'rniga
    `ErrorState onRetry={() => reload()}`.

### Tasdiqlash

`npx tsc --noEmit` — **courier, seller, admin** uchun toza o'tdi (exit 0).

---

## Qolgan roadmap (keyingi bosqichlar)

Audit ~80 ta topilma berdi. Quyidagilar **ataylab keyinga** qoldirildi — ular kengroq
o'zgarish yoki dizayn qarorini talab qiladi:

### A. Semantic rang tokenlari (design-system qarori kerak)

`Badge`, `StatCard`, `StatusBanner` va inline error/alert'lar Tailwind'ning standart
palitrasini (`green-700`, `amber-800`, `red-700`, `sky-700` `-50` fon ustida)
ishlatadi. Bular **kontrast jihatidan to'g'ri**, lekin §12 ("8 dan ortiq rang yo'q")
ga zid. To'g'ri yechim — semantic tokenlarning **quyuq variantlarini** qo'shish
(`--color-success-700`, `--color-danger-700`, `--color-warning-700`, `--color-info-700`)
chunki hozirgi yagona-shade tokenlar (`success #16A34A` va h.k.) chip matni uchun
juda och → kontrast pasayadi. Bu §14 bo'yicha **avval DESIGN_SYSTEM.md yangilanishini**
talab qiladi. Hozircha tegilmadi (kontrast regressiyasidan saqlanish uchun).

### B. Error/loading holatlari — qolgan sahifalar

`ErrorState` primitivi tayyor; uni quyidagilarga ulash kerak (ko'pi hook'da `error` +
`reload`/`refresh` allaqachon bor):
- Seller: finance, products, contracts, store sahifalari.
- Admin: dashboard summary, moderation, couriers, sellers, customers va boshqa
  jadval-sahifalar (ko'pi inline `border-red-100 bg-red-50` error div ishlatadi).
- Courier: `ErrorState` hali yaratilmadi — `courier/src/components/ui/` ga qo'shilsin.
- `alert()` / `confirm()` (admin UsersTable, categories, moderation) — `Modal`/
  `ConfirmDialog` bilan almashtirilsin.
- Bare `Spinner` (label'siz) → kontent `Skeleton` bilan almashtirilsin (catalog,
  finance, stores va h.k.).

### C. Mobil/responsive — qolgan nuqtalar

- Client cart miqdor tugmalari `h-7 w-7` (28px) → kamida `h-9 w-9` (touch-target).
- Client `ProductCard` yulduzlari `amber-400` → `accent-400` token.
- Admin jadval filtrlari (`w-52`, `w-44`) `<360px` da oshib ketadi → `w-full sm:w-52`.
- Admin inline header'lar (categories/brands/attributes) PageHeader ishlatmaydi →
  PageHeader'ga ko'chirilsin yoki `flex-col sm:flex-row` qilinsin.

### D. Shared komponent API to'liqligi

- `Button` `danger` hover hardcoded `red-700/red-800` (seller/courier) — `danger`
  tokenining quyuq variantiga bog'lansin (A bilan birga).
- Courier select/textarea — `Select`/`Textarea` shared komponentlariga ko'chirilsin
  (hozir inline focus klass).
- `Switch`/`Toggle` komponenti (courier online-status toggle inline qilingan).

> Keyingi bosqichni boshlashdan oldin **A (token kengaytirish)** bo'yicha qaror kerak,
> chunki B/D ning ko'pi shunga bog'liq.
