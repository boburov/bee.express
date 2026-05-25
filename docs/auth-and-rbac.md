# Auth va RBAC

## Foydalanuvchi turlari

`/auth/me` quyidagi ikki shaklning birini qaytaradi (server `auth.service.ts`):

```ts
type Me =
  | { type: "super_admin"; id: string; username: string; fullName: string | null }
  | {
      type: "user";
      id: string;
      phone: string | null;
      telegramId: string | null;
      firstName: string | null;
      lastName: string | null;
      role: { id: string; slug: string; name: string } | null;
    };
```

- `super_admin` — alohida `SuperAdmin` jadvalida. **Hech qachon `role` ga ega emas**, lekin
  RolesGuard ichida hamma role-protected route ga **bypass** qiladi.
- `user` — barcha qolgan ishtirokchilar (customer, seller, courier, admin xodimi).
  Role `slug` qiymatlari: `customer`, `seller`, `courier`, `admin`.

## Auth oqimlari

### 1) SuperAdmin login (admin paneli)
- `POST /auth/super-admin/login { username, password }` → tokens.
- Faqat admin paneli ishlatadi. Boshqa panellar bu endpointni chaqirmaydi.

### 2) Telefon + OTP (seller, courier, customer)
- `POST /auth/phone/request { phone }` → `ttlSeconds`. Bot orqali kod yuboriladi.
- `POST /auth/phone/verify { phone, code }` → tokens + user.
- Telefon Telegram bot bilan oldindan bog'lanishi kerak — bot `/start` orqali yuboriladi.

### 3) Telegram Mini App initData (customer / kuryer)
- Mini App ichida `window.Telegram.WebApp.initData` mavjud.
- `POST /auth/telegram/mini-app { initData }` → tokens. Server initData ni `BOT_TOKEN`
  bilan tekshiradi (HMAC).
- Mini App da bu birinchi navbatda chaqiriladi, telefon OTP fallback bo'lib qoladi.

### 4) Refresh
- `POST /auth/refresh { refreshToken }` → yangi access + refresh.
- Axios interceptor 401 dan keyin avtomatik chaqiradi.

## Tokenlar
- `accessToken` JWT — `Authorization: Bearer …` header.
- `refreshToken` — opaque, DB ga saqlanadi (server rotation qiladi).
- Frontda zustand persist (`bee-<panel>-auth` localStorage kalit) saqlanadi.

## Frontend RBAC

`src/shared/auth/RoleGuard.tsx` — har sahifa/layout boshida:

```tsx
<AuthBoundary>
  <RoleGuard allowed={["super_admin"]}>
    {/* admin paneli yoki sub-route */}
  </RoleGuard>
</AuthBoundary>
```

- `AuthBoundary` — hydrate kut → token yo'q → `/login` ga redirect → `me` yo'q → `/auth/me`
  chaqir → keyin children render.
- `RoleGuard` — ruxsat ro'yxati `me.type` yoki `me.role.slug` bilan solishtiradi. Mos
  bo'lmasa: `403` sahifa yoki redirect.

`super_admin` har doim ham `RoleGuard` ni bypass qiladi (server bilan teng).

## Backend RBAC

`server/src/auth/`:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "seller")
@Get("orders")
listOrders(@CurrentUser() user: Authenticated) { … }
```

- `@Public()` — guard ni butunlay o'chiradi (login, webhook).
- `@SuperAdminOnly()` — faqat super_admin.
- `@Roles(...)` — slug ro'yxati. SuperAdmin bypass.

**Qoida:** har bir non-public route da role decorator bo'lishi shart. Decorator
bo'lmasa code-review da bloklanadi.

## Frontend → Backend role mapping

| Panel | UI ruxsat etilgan tip | Server `@Roles(…)` |
| --- | --- | --- |
| admin/ | `super_admin` | `@SuperAdminOnly()` (yoki admin slug) |
| seller/ | role.slug = `seller` | `@Roles("seller")` |
| courier/ | role.slug = `courier` | `@Roles("courier")` |
| client/ | role.slug = `customer` (yoki yo'q) | `@Roles("customer")` (ko'pchilik route) |

Agar user noto'g'ri panelga kirsa (masalan, courier admin/ ga) — frontend RoleGuard
yopadi va `/login` ga qaytaradi.

## Logout

`POST /auth/logout { refreshToken }` — server refresh tokenni revoke qiladi. Front clear
qiladi, `/login` ga ketadi.

## Hodisalar tarixi va kelajak uchun belgilar

### 2026-05-25 — Login 500 muammosi va refresh interceptor

**Muammo:** `/api/auth/super-admin/login` 500 qaytarardi. Sabab — Prisma MariaDB
adapter MySQL 8+ caching_sha2_password autentifikatsiyasida pool connection
yarata olmasdi (`RSA public key is not available client side`).

**Tuzatish:** `DATABASE_URL` ga `?allowPublicKeyRetrieval=true` qo'shildi
(`server/.env`). MariaDB driver shu paramni qabul qiladi va RSA public key'ni
serverdan olib keladi.

> ⚠️ Production'da `useSSL=true` yoki user'ni `mysql_native_password` ga
> o'tkazish kerak — `allowPublicKeyRetrieval` faqat lokal/SSL connection uchun.

### Boshqa qatnashgan tuzatishlar

- **SuperAdminLoginDto** — `password` field'idan `@MinLength(8)` olib tashlandi.
  Login DTO'da format tekshiruvi noto'g'ri parolda **leaky 400** xabari beradi
  ("password must be longer than..."). Format qoidasi SuperAdmin yaratish
  yo'lida bo'lishi kerak; login esa har doim 401 ("Login yoki parol noto'g'ri")
  qaytarsin.

- **Refresh interceptor** — `cfg.url?.includes("/auth/")` o'rniga aniq
  `NO_RETRY_PATHS` ro'yxati ishlatildi (`shouldSkipRefresh`). Eski versiya
  `/auth/me` ham, `/auth/refresh` ham, login endpoint'larini ham bir xil
  tashlardi — bu access token muddati tugagan paytda `/auth/me` chaqirig'i
  avtomatik refresh qilmasligini va user'ni darhol logout qilishini bildirardi.
  Yangi versiya faqat `auth/refresh`, login va logout endpoint'larini istisno
  qiladi. To'rt panelda (admin, client, courier, seller) bir xil tuzatish qilindi.
