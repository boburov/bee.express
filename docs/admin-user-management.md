# Admin — Foydalanuvchi, Audit, Rollar

Bu modul SuperAdmin paneli uchun **uchta bog'liq sahifa** va ularga xizmat qiluvchi
backend modulini qamrab oladi:

| Sahifa | Backend | Asosiy maqsad |
| --- | --- | --- |
| `/dashboard/customers` | `GET /api/admin/users` | Barcha foydalanuvchilarni ko'rish, rol biriktirish, bloklash |
| `/dashboard/sellers` | `GET /api/admin/users?roleSlug=seller` | Faqat sotuvchi rolidagilar |
| `/dashboard/couriers` | `GET /api/admin/users?roleSlug=courier` | Faqat kuryer rolidagilar |
| `/dashboard/audit` | `GET /api/admin/audit` | Tizim audit logini ko'rish |
| `/dashboard/roles` | `GET /api/admin/roles` + CRUD | Rol va ruxsatlarni boshqarish |

## Maqsad

TZ §18.2–18.4 va §24 (xavfsizlik) bo'limlarini qondirish:

- Super Admin moderatsiya qilishi va rollarni biriktirishi mumkin.
- Har bir muhim amal (login, blok, rol o'zgarishi) **audit logga** yoziladi.
- Rollar dinamik — yangi rol qo'shilsa, kod o'zgartirilmaydi, faqat ruxsatlar
  katalogiga yangi `slug` qo'shiladi (`admin/src/entities/role/api.ts`
  `PERMISSION_CATALOG`).

## Backend

Yangi modul: `server/src/admin/`.

```
server/src/admin/
├── admin.module.ts            # UsersModule + AuditModule + RolesModule
├── users/
│   ├── users.controller.ts    # @SuperAdminOnly()
│   ├── users.service.ts
│   ├── user.serializer.ts     # BigInt phone → string, placeholder → null
│   └── dto/{list-users-query,block-user,assign-role}.dto.ts
├── audit/
│   ├── audit.controller.ts
│   ├── audit.service.ts       # actorId → user/superadmin label resolver
│   └── dto/list-audit-query.dto.ts
└── roles/
    ├── roles.controller.ts
    ├── roles.service.ts       # uniqueSlug, prevent delete of isSystem
    └── dto/{create-role,update-role}.dto.ts
```

### Endpointlar

| Method | Path | Maqsad |
| --- | --- | --- |
| GET | `/api/admin/users?roleSlug&isBlocked&q&page&pageSize` | Sahifalangan ro'yxat |
| GET | `/api/admin/users/:id` | Bitta foydalanuvchi |
| PATCH | `/api/admin/users/:id/block` `{ reason? }` | Bloklash + sessiyalarni revoke |
| PATCH | `/api/admin/users/:id/unblock` | Tiklash |
| PATCH | `/api/admin/users/:id/role` `{ roleId\|null }` | Rol biriktirish |
| GET | `/api/admin/audit?action&actorType&actorId&from&to&page&pageSize` | Audit logi |
| GET | `/api/admin/roles` | Barcha rollar + userCount |
| GET | `/api/admin/roles/:id` | Bitta rol |
| POST | `/api/admin/roles` | Yangi rol (isSystem=false) |
| PATCH | `/api/admin/roles/:id` | Tahrirlash (name/description/permissions) |
| DELETE | `/api/admin/roles/:id` | O'chirish (isSystem=false, userCount=0) |

Hammasi `@SuperAdminOnly()` — global `JwtAuthGuard` + `RolesGuard` orqali tekshiriladi.

### Audit yozuvi

Har bir mutating amal `AuditLog` jadvaliga yoziladi. Asosiy action key'lar:

- `auth.login.phone` / `auth.login.miniapp` / `auth.login.superadmin` — auth service yozadi.
- `user.block`, `user.unblock`, `user.role.assign` — users.service.
- `role.create`, `role.update`, `role.delete` — roles.service.

Metadata `Prisma.InputJsonValue` sifatida saqlanadi. Audit listga olib kelishda
`actorId` foydalanuvchi yoki super admin nomiga o'giriladi (bir nechta DB hit
o'rniga `findMany({ where: { id: { in: ids } } })`).

### Frontend RBAC

Sahifa darajasida `<RoleGuard allowed={["super_admin"]}>` `DashboardShell` ichida.
Server tomonda `@SuperAdminOnly()` har bir endpointda. Ikkala qatlamda ham
tekshiruv bor — frontend faqat UX uchun (sahifaga kirishni darhol yopish).

## Frontend tuzilishi

```
admin/src/
├── entities/
│   ├── user/{api,types}.ts
│   ├── audit/{api,types}.ts
│   └── role/{api,types}.ts
├── features/
│   ├── users/
│   │   ├── users-table/UsersTable.tsx       # qidiruv, blok filter, pagination
│   │   ├── block-user/BlockUserModal.tsx
│   │   └── assign-role/AssignRoleModal.tsx
│   ├── audit/audit-list/AuditList.tsx       # icon timeline + metadata expand
│   └── roles/
│       ├── roles-list/RolesList.tsx         # 3-column card grid
│       └── role-form/RoleFormModal.tsx      # permissions checklist
└── app/dashboard/
    ├── customers/page.tsx   # UsersTable (no roleSlug)
    ├── sellers/page.tsx     # UsersTable fixedRoleSlug="seller"
    ├── couriers/page.tsx    # UsersTable fixedRoleSlug="courier"
    ├── audit/page.tsx       # AuditList
    └── roles/page.tsx       # RolesList
```

`UsersTable` — bitta reusable komponent, uchta sahifani quvvatlantiradi
(`customers`, `sellers`, `couriers`). FSD qoidasiga rioya qilingan:

- `entities/*` — domain typelar + API client.
- `features/*` — biznes logikali widget (page'ga tushadi).
- `shared/ui/*` — yangi qo'shilgan: `Table`, `Pagination`, `Select`, `Avatar`.
- `shared/lib/useDebounce.ts` — qidiruv input'i uchun.

## Ekran/UX qoidalar

Har sahifa uchta holatni qamrab oladi:

- **Loading:** `Skeleton` qatorlari (jadval) yoki kartochka skeletlari.
- **Empty:** `EmptyState` — filterga mos kelmagan va umuman bo'sh holat farqlanadi
  (filter aktiv bo'lsa "Filterlarni tozalab qaytadan urinib ko'ring" ko'rsatiladi).
- **Error:** `bg-red-50` + `text-red-700` xato banner.

Filtrlar — debounce 300ms qidiruv + native `<select>` (shared `Select`).
Pagination — kompakt `1–20 / 247` + prev/next. Sahifa raqamlari yo'q (filter
muhimroq).

## Dizayn tizim

Bu modul `DESIGN_SYSTEM.md` ichidagi tokenlarga to'liq amal qiladi:

- Premium orange asosiy CTA (`bg-brand-500`), `bg-gradient-premium` faqat
  avatar fallbacki uchun.
- Status uchun semantik tonlar: `success` (aktiv), `danger` (bloklangan),
  `brand` (rol badge), `info` (auth.login.miniapp).
- Iconography Lucide — kichik (`h-4 w-4`), semantik (Ban, ShieldCheck, Plus,
  Pencil, Trash2, Users).
- Hech qanday hardcoded hex — `red-50/100/700` Tailwind palette (semantic).

## Keyingi qadamlar

- [ ] Foydalanuvchi tafsilot sahifasi (`/dashboard/customers/[id]`) — sessiyalar,
      buyurtma tarixi, audit log filtri.
- [ ] Audit ichidan resource bo'yicha filter (`?resource=user`).
- [ ] Permissions katalogini server'dan olish (hozir client'da qattiq yozilgan).
- [ ] Bulk action — bir necha foydalanuvchini birdaniga bloklash/role berish.
- [ ] CSV eksport (audit log).
