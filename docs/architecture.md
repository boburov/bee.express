# Arxitektura

## Monorepo tuzilishi

```
bee.express/
├── admin/      # SuperAdmin paneli (Next.js 16 + App Router)
├── seller/     # Sotuvchi paneli (Next.js)
├── courier/    # Kuryer paneli (Next.js, kelajakda Telegram Mini App)
├── client/     # Xaridor paneli (Next.js, Telegram Mini App)
├── server/     # NestJS REST API + Prisma
├── bot/        # Telegram bot (OTP, mini-app launcher)
├── assets/     # umumiy assetlar (logo, fonts)
├── docs/       # texnik hujjatlar
└── DESIGN_SYSTEM.md   # UI standartlar
```

Har bir panel **mustaqil Next.js ilovasi** — alohida `package.json`, alohida portda
ishlaydi. Shared resourse hozircha **fayl darajasida** ko'chiriladi (assets/logo.png va
DESIGN_SYSTEM.md), kelajakda `packages/` ostida shared package bo'lishi mumkin.

## Panel ichidagi qatlamlar (FSD — Feature-Sliced Design)

```
src/
├── app/             # Next.js App Router (routing only)
│   ├── (auth)/      # auth route group: login, reset, …
│   ├── (panel)/     # protected route group: dashboard, orders, …
│   ├── layout.tsx
│   └── globals.css
├── shared/          # eng past qatlam — hech kimga bog'liq emas
│   ├── ui/          # Button, Input, Card, Logo, EmptyState, …
│   ├── auth/        # auth-store, api, AuthBoundary, RoleGuard
│   ├── lib/         # cn, formatters, hooks
│   ├── config/      # env, navigatsiya manbalari
│   └── icons/       # custom svg / branding
├── entities/        # domain models (user, order, product, category, brand, …)
│   └── <name>/
│       ├── api.ts   # entity uchun maxsus axios chaqiruvlar
│       ├── types.ts
│       └── ui/      # entity-specific ko'rinishlar (UserBadge, OrderRow, …)
├── features/        # use-case lar — entities + shared dan foydalanadi
│   └── <name>/
│       ├── ui/
│       └── model.ts
└── widgets/         # composite layout bloklari (Sidebar, Topbar, BottomNav, …)
```

**Qoida:** yuqori qatlam pastdan import qilishi mumkin, teskari yo'l yo'q.
`shared → entities → features → widgets → app`.

### Sahifa fayli nima qiladi?

`app/.../page.tsx` faylida **biznes logika yozilmaydi** — u faqat:

1. RBAC guard (`<AuthBoundary allowed={…}>`).
2. PageHeader + sahifa kompozitsiyasi (widget va feature larni terish).

Har bir feature alohida fayl. Misol: `features/auth/login-form/ui/LoginForm.tsx` — bu
yerda forma logikasi va API chaqiruvi. Sahifa shunchaki `<LoginForm />` ni render qiladi.

## Panel ↔ Server kontrakti

- Bazaviy URL: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`).
- Har bir so'rovga `Authorization: Bearer <accessToken>` — axios interceptor qo'yadi.
- 401 kelganda interceptor `/auth/refresh` chaqirib, qaytadan urinadi.
- Server tomonda `JwtAuthGuard` + `RolesGuard` — har route uchun **role tekshiriladi**.
  Frontend `RoleGuard` faqat UX uchun (sahifaga kirishni yumshatish), security manbai
  server.

## Stack

| Qatlam | Texnologiya |
| --- | --- |
| Panellar | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind v4 (`@theme` tokens), Josefin Sans, Lucide icons |
| State | Zustand (persisted store for auth + ui flags) |
| HTTP | Axios (with refresh interceptor) |
| Server | NestJS, Prisma, PostgreSQL |
| Auth | JWT access (qisqa) + refresh (uzun), Telegram Mini App initData |
| Bot | grammY (Telegram) |

## Build va dev

```bash
# har bir panel uchun
cd admin && npm run dev   # default 3000
cd client && npm run dev  # default 3000 (boshqa portga o'tkazing)
cd server && npm run start:dev   # 4000
```

Production build: `npm run build && npm run start`.
