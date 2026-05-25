# BeeExpress — Documentation

BeeExpress loyihasining barcha **inson-o'qiydigan** texnik hujjatlari shu papkada.
Asosiy qoidalar:

- Har bir **task** yoki **feature** uchun alohida `.md` fayl yoziladi.
- Fayl nomi `kebab-case` (masalan, `auth-flow.md`, `catalog-v1.md`).
- Yangi fayl qo'shilganda — quyidagi indeksga link kiritiladi.
- Hujjatlar tilida o'zbek (lotin) — kod blokda ingliz texnik atamasi qoladi.

## Arxitektura va platforma

- [`architecture.md`](./architecture.md) — Loyihaning ko'p-paketli tuzilishi, panellar va
  server o'rtasidagi munosabat, har bir panel ichidagi FSD qatlamlari.
- [`auth-and-rbac.md`](./auth-and-rbac.md) — Auth oqimi (SuperAdmin password, telefon OTP,
  Telegram Mini App initData) va role-based access control (RBAC).
- [`design-system.md`](./design-system.md) — Visual guide pointer.
- [`mvp-skeleton.md`](./mvp-skeleton.md) — Birinchi MVP skeleton bosqichi (Admin + User
  Panel + shared UI + RBAC) yetkazib berilishi.

## Modul-spetsifik

- [`catalog-v1.md`](./catalog-v1.md) — Kategoriya / brend / atribut katalog modullari.
- [`admin-user-management.md`](./admin-user-management.md) — Admin Users + Audit + Roles
  modullari (server `admin/*` + admin panel `features/users|audit|roles`).
- [`features.md`](./features.md) — Feature progresi va keyingi reja.

## Yangi hujjat qo'shganda nima qilish kerak

1. `docs/<kebab-name>.md` faylini yoz.
2. Birinchi qatorda `# <Sarlavha>` va keyin paragraf bilan kontekst.
3. Bo'limlar: **Maqsad**, **Qanday ishlaydi**, **API kontrakti** (agar bo'lsa),
   **Ekran/UX**, **Keyingi qadamlar**.
4. Shu indekgsga qisqa havola qo'shing (1-2 satr).
