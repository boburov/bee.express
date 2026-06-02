# Sotuvchi paneli — refresh (design + auth) — 2026-05-25

Eski sotuvchi paneli `components/` + `lib/` flat structure'da, Geist font'da va
sariq `bee-*` (#FBC02D) palitrasida edi. Auth oqimi token'larni saqlab keyin
rolni tekshirardi — bu kichik race oynasini ochardi.

Bu sprint sotuvchi panelni admin/client bilan to'liq paritetga keltiradi.

## Maqsad

- **Dizayn:** admin/client'dagi premium orange + Josefin Sans + FSD tuzilishi.
- **Auth:** token saqlash **rol tekshiruvidan keyin** — token hech qachon
  unauthorized hisobda yozilmaydi.
- **Reusable:** shared/ui kit (Button, Card, Badge, Avatar, Spinner, ...) va
  shared/auth primitives (AuthBoundary, RoleGuard, store, api) — admin/client
  bilan API darajasida bir xil.

## Auth oqimi (yangi versiya)

```
1. Foydalanuvchi telefonni kiritadi
2. POST /auth/phone/request → bot OTP yuboradi
3. Foydalanuvchi 6-raqamli kodni kiritadi
4. POST /auth/phone/verify → server { accessToken, refreshToken, expiresIn } qaytaradi
5. ★ Token STORE'GA YOZILMAYDI — birinchi /auth/me chaqirig'i bir martalik
   bearer header bilan amalga oshiriladi:
       api.get<Me>("/auth/me", {
         headers: { Authorization: `Bearer ${data.accessToken}` },
       })
6. hasSellerRole(me) tekshiruvi:
   - rol="seller" emas bo'lsa:
       - /auth/logout chaqiriladi → refresh token revoke
       - xato ko'rsatiladi: "Bu hisob 'seller' roliga ega emas..."
       - store toza qoladi
       - localStorage'da ham token yo'q
   - rol="seller" bo'lsa:
       - setTokens(...) — store'ga yoziladi
       - setMe(me)
       - router.replace("/dashboard")
```

Bu eskidan farqi:

| Eski | Yangi |
| --- | --- |
| `setTokens(...)` darhol → `api.get('/auth/me')` (token allaqachon store'da) | One-shot header bilan `/auth/me` → `setTokens` faqat rol mos kelsa |
| Token milliseconds'da localStorage'da yozilib, keyin `clear()` qilinardi | Hech qachon yozilmaydi |
| AuthBoundary mantiqi dashboard layout'da inline edi | `<AuthBoundary>` + `<RoleGuard>` shared, qayta ishlatiladigan |

## Dizayn paritetlari

`globals.css`:

| Eski | Yangi |
| --- | --- |
| `--color-bee-500: #FBC02D` (sariq) | `--color-brand-500: #F97316` (premium orange) |
| `bee-*` 10 ta shade | `brand-*` 10 ta + `bee-*` alias |
| `--font-sans: var(--font-geist-sans)` | `--font-sans: var(--font-josefin)` |
| Hech qanday gradient yo'q | `bg-gradient-warm`, `bg-gradient-soft`, `bg-gradient-premium`, `shadow-card`, `shadow-pop` |

`Logo.tsx`:

```diff
- <span aria-hidden className="... bg-ink text-bee-500" style="...">
-   🐝
- </span>
+ <Image src="/logo.png" alt="BeeExpress" width={size} height={size} priority />
```

`assets/logo.png` → `seller/public/logo.png` (md5 bir xil).

## FSD struktura

```
seller/src/
├── app/
│   ├── globals.css       # premium @theme tokens
│   ├── layout.tsx        # Josefin Sans
│   ├── page.tsx          # /  → /login yoki /dashboard
│   ├── login/page.tsx    # gradient hero + LoginForm + trust strip
│   └── dashboard/
│       ├── layout.tsx    # <DashboardShell> wrap
│       └── page.tsx      # PageHeader + 5 ta StatCard + next-steps card
├── features/
│   └── auth/seller-login/LoginForm.tsx   # phone OTP + role-gating
├── shared/
│   ├── auth/             # AuthBoundary, RoleGuard, store, api, LogoutButton
│   ├── ui/               # 11 ta komponent (admin bilan paritet)
│   ├── lib/              # cn, phone
│   └── config/           # env, nav
└── widgets/
    ├── sidebar/          # premium gradient header + Lucide icon nav
    ├── topbar/           # breadcrumb
    └── dashboard-shell/  # AuthBoundary + RoleGuard + Sidebar + Topbar
```

Eski `seller/src/components/` va `seller/src/lib/` **butunlay o'chirildi**.

## Login sahifa

- Gradient hero (`bg-gradient-warm` + `bg-gradient-soft`).
- `Logo size={48}` + tagline.
- `<SellerLoginForm />` — `Card` ichida, 2-step (phone → code).
- 3-ustunli trust strip — `Package / ShoppingBag / Wallet` Lucide ikonlarda.
- Bot havolasi pastda.

## Dashboard

- `<PageHeader>` — "Xush kelibsiz, {ism}" + tushuntirish.
- 5 ta `<StatCard>` (Bugungi buyurtmalar, Bugungi tushum, Aktiv mahsulotlar,
  Do'kon reytingi, Konversiya) — hozircha `value="—"`, server endpoints
  ulanganda real ma'lumot.
- Keyingi qadamlar card — bullet ro'yxat.

## Sidebar nav (TZ §19 bo'yicha)

| Bo'lim | Yo'l | Ikon |
| --- | --- | --- |
| Boshqaruv | `/dashboard` | `LayoutDashboard` |
| Mahsulotlar | `/dashboard/products` | `Package` |
| Do'kon | `/dashboard/store` | `Store` |
| Buyurtmalar | `/dashboard/orders` | `ShoppingBag` |
| Moliya | `/dashboard/finance` | `Wallet` |

Active item: `bg-brand-50 text-brand-700`. Bottom'da user pill + Chiqish.

## RBAC paritet

| Qatlam | Tekshiruv |
| --- | --- |
| Login form | `hasSellerRole(me)` **token saqlashdan oldin** |
| Frontend route guard | `<RoleGuard>` (hasSellerRole, redirect to /login if mismatch) |
| Server endpoint guard | `@Roles("seller")` (har bir sotuvchi route'da; super_admin bypass) |
| Token refresh | Admin/client bilan bir xil `NO_RETRY_PATHS` whitelist |

## Yangi sotuvchi qo'shish

Hozir sotuvchi roli avtomatik berilmaydi. Jarayoni:

1. Foydalanuvchi `@BeeExpressBot` ga `/start` bosadi, telefonni share qiladi.
2. Admin `/admin/dashboard/customers` ga kiradi, foydalanuvchini topadi.
3. "Rol" tugmasini bosadi, "Sotuvchi" rolini biriktiradi.
4. Foydalanuvchi `/seller/login` ga kirib, telefonni kiritadi, kodni kiritadi.
5. ★ Endi rol tekshiruvi muvaffaqiyatli o'tadi, dashboard ochiladi.

> Eslatma: `seller` role DB'da bo'lishi kerak. Seed `seedSystemRoles` faqat
> `admin` rolini yaratadi. Sotuvchi roli admin tomonidan `/admin/dashboard/roles`
> orqali yaratiladi (yoki seed'da qo'shilishi mumkin keyingi sprint'da).

## Keyingi qadamlar

- [ ] `/dashboard/products` — mahsulot wizard (master search → offer create).
- [ ] `/dashboard/store` — KYC + ish vaqti + delivery radius sozlamalari.
- [ ] `/dashboard/orders` — buyurtma list view + status update.
- [ ] `/dashboard/finance` — kunlik/oylik tushum + payout history.
- [ ] `Seed` ga `seller`, `courier`, `customer` rollarini qo'shish.
