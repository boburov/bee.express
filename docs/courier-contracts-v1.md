# Kuryer kontrakt tizimi v1 (Courier Contracts)

Do'kon ↔ kuryer **shartnoma (kontrakt)** modeli: har bir odam kuryer bo'la oladi,
do'kon bilan kontrakt tuzadi, va o'sha do'konning tayyor buyurtmalari aynan
kontraktli kuryerga **avtomatik biriktiriladi** ("pochta bor, olib keting").
Avvalgi [kuryer-panel-v1](./courier-panel-v1.md) ochiq pool modelining ustiga
qurilgan — pool buzilmagan, u **fallback** sifatida saqlanadi.

## Maqsad va qarorlar

| Qaror | Tanlov |
|---|---|
| **Kuryer bo'lish** | Odam ariza beradi → **admin tasdiqlaydi** → `courier` roli beriladi |
| **Kontrakt** | Kuryer so'rov yuboradi → **sotuvchi tasdiqlaydi** (`PENDING → ACTIVE`) |
| **Dispatch** | `READY` buyurtma **bitta** kontraktli kuryerga avtomatik biriktiriladi (qabul shart emas) |
| **Fallback** | Kontraktli kuryer band bo'lsa → ochiq global poolga chiqadi; oluvchi bilan **vaqtinchalik kontrakt** tuziladi |

## Oqim diagrammasi

```
Odam ──apply──▶ CourierApplication(PENDING) ──admin approve──▶ User.role=courier
                                              └──admin reject──▶ REJECTED (qayta ariza mumkin)

Kuryer ──request──▶ CourierContract(PENDING) ──seller approve──▶ ACTIVE ─┐
                                              └──seller reject──▶ REJECTED │ (dispatchga kiradi)
                                                                           │
Buyurtma READY  ──┬─ kontraktli, bo'sh kuryer bor ─▶ COURIER_ASSIGNED (avto) ──▶ ON_WAY ──▶ DELIVERED
                  └─ hammasi band/oflayn ─▶ READY (ochiq pool) ──accept──▶ COURIER_ASSIGNED
                                                                   └─▶ vaqtinchalik kontrakt (ACTIVE, isTemporary, +14 kun)
```

## Ma'lumotlar bazasi

Migration: `20260531074413_add_courier_contracts`. `Order` o'zgarmadi (mavjud
`courierId`, `courierEarning`, `courierAssignedAt`, `pickedUpAt` ishlatiladi).

**`CourierApplication`** — bitta odam, bitta ariza (`@@unique(userId)`; rad
etilgach qayta `PENDING`):
`status (PENDING|APPROVED|REJECTED)`, `transportType`, `fullName`, `note`,
`documentUrls (Json)`, `rejectionReason`, `reviewedAt`, `reviewedBy`.

**`CourierContract`** — `@@unique([courierId, storeId])`:
`status (PENDING|ACTIVE|REJECTED|REVOKED)`, `isTemporary`, `expiresAt`,
`message`, `rejectionReason`, `approvedAt`.
Indekslar: `[storeId, status]` (dispatch), `[courierId, status]` (kuryer ro'yxati).

## API kontrakti (prefiks `/api`)

### Onboarding — `@Roles` YO'Q (har qanday tizimga kirgan foydalanuvchi)
| Metod | Yo'l | Vazifa |
|---|---|---|
| `GET` | `/courier/onboarding/me` | `{ isCourier, application }` |
| `POST` | `/courier/onboarding/apply` | `{ transportType, fullName?, note?, documentUrls? }` → upsert (re-apply = PENDING). Allaqachon kuryer bo'lsa 400 |

### Kuryer — `@Roles('courier')`
| Metod | Yo'l | Vazifa |
|---|---|---|
| `GET` | `/courier/stores?lat=&lng=&q=&page=` | ACTIVE do'konlar + **mening kontrakt holatim** annotatsiyasi (geo ixtiyoriy) |
| `GET` | `/courier/contracts?status=` | Mening kontraktlarim |
| `POST` | `/courier/contracts` | `{ storeId, message? }` → so'rov (PENDING) |
| `POST` | `/courier/contracts/:id/cancel` | `{ reason? }` → kuryer o'z kontraktini bekor qiladi (REVOKED) |

### Sotuvchi — `@Roles('seller')` + `SellerContext.requireOwnStore`
| Metod | Yo'l | Vazifa |
|---|---|---|
| `GET` | `/seller/contracts?status=` | Do'konimning kontraktlari (so'rovlar birinchi) |
| `PATCH` | `/seller/contracts/:id/approve` | PENDING → ACTIVE |
| `PATCH` | `/seller/contracts/:id/reject` | `{ reason }` → REJECTED |
| `PATCH` | `/seller/contracts/:id/revoke` | `{ reason? }` → ACTIVE/PENDING → REVOKED |

### Admin — `@SuperAdminOnly()`
| Metod | Yo'l | Vazifa |
|---|---|---|
| `GET` | `/admin/moderation/courier-applications?page=&pageSize=&q=` | PENDING arizalar |
| `POST` | `/admin/moderation/courier-applications/:id/approve` | APPROVED + **`courier` roli biriktirish** + `profile.courier` seed + audit |
| `POST` | `/admin/moderation/courier-applications/:id/reject` | `{ reason }` → REJECTED |

## Dispatch algoritmi (`DispatchService.onOrderReady`)

Buyurtma `READY` bo'lganda (sotuvchi `OrdersService.transitionStatus` ichidan,
best-effort — dispatch xatosi o'tishni buzmaydi):

1. Do'konning **ACTIVE va muddati o'tmagan** (`expiresAt > now` yoki `null`)
   kontraktli kuryerlarini topadi.
2. **Bo'sh** kuryer = `profile.courier.isOnline === true` && `!isBlocked` &&
   faol buyurtmasi yo'q (`COURIER_ASSIGNED|ON_WAY` soni `< MAX_CONCURRENT=1`).
3. Bo'sh bor → eng kam yuklangan / eng eski biriktirilganni (round-robin)
   **atomik** biriktiradi: `updateMany({ where:{ id, status:READY, courierId:null }})`
   → `COURIER_ASSIGNED`, `courierEarning = round100(deliveryFee × 0.8)`. Kuryerga
   "pochta bor 📦" bildirishnoma.
4. Bo'sh yo'q → buyurtma `READY` (pool) qoladi; kontraktli kuryerlarga
   informativ bildirishnoma. Mavjud `/courier/available` + `/courier/orders/:id/accept`
   uni ko'rsatadi.

**Vaqtinchalik kontrakt:** `CourierService.accept()` (pool) muvaffaqiyatli
bo'lgach, agar (kuryer, do'kon) uchun kontrakt bo'lmasa, `ACTIVE` +
`isTemporary:true` + `expiresAt:+14 kun` yaratiladi. Mavjud kontrakt (shu jumladan
REJECTED) ustidan yozilmaydi — sotuvchi qaroriga hurmat.

Konstantalar: `MAX_CONCURRENT_PER_COURIER=1`, `TEMPORARY_CONTRACT_DAYS=14`,
`COURIER_DELIVERY_SHARE=0.8`.

## Frontend

- **Kuryer (`courier/`)** — kirgan, lekin `courier` roli yo'q foydalanuvchi
  `/apply` ekraniga yo'naltiriladi (login emas). `/dashboard/stores` — do'kon
  browse + "Kontrakt so'rash / Bekor qilish / To'xtatish". Avto-biriktirilgan
  buyurtmalar mavjud "Yetkazmalar" feed'ida ko'rinadi.
- **Sotuvchi (`seller/`)** — `/dashboard/contracts` ("Kuryerlar"): PENDING
  so'rovlarni tasdiqlash/rad etish, faol kuryerlar (onlayn holati) + to'xtatish.
- **Admin (`admin/`)** — Moderatsiya sahifasida 3-tab **"Kuryer arizalari"**
  (tasdiqlash/rad etish). Tasdiqlangan kuryerlar mavjud `/dashboard/couriers`
  ro'yxatida avtomatik ko'rinadi.

> **Eslatma:** Rol guard (`JwtStrategy.validate`) rolni **har so'rovda DB'dan**
> qayta o'qiydi — admin tasdiqlagach kuryerning mavjud tokeni darhol kuryer
> huquqini oladi, qayta login shart emas.

## Tekshiruv

- `npx prisma migrate dev` — toza qo'llandi (`20260531074413_add_courier_contracts`).
- `nest build` + 4 ilova `tsc --noEmit` — xatosiz. `courier`/`seller`/`admin`
  `next build` — barcha route'lar (shu jumladan `/apply`, `/dashboard/stores`,
  `/dashboard/contracts`) yig'ildi.
- Server boot — DI graf hal bo'ldi, barcha yangi route'lar map qilindi.
- **E2E (17/17 ✅, JWT mint + real HTTP):** apply→PENDING → admin approve→courier
  roli → contract request→seller approve→ACTIVE → READY→avto-biriktirish
  (COURIER_ASSIGNED, earning muhrlandi) → kuryer band→2-buyurtma poolda →
  pool accept→vaqtinchalik kontrakt → qayta accept→409.

## Keyingi qadamlar

- **Realtime "pochta bor"** — `notifications.gateway` mavjud, lekin courier app'da
  socket client yo'q; hozir persisted notification + refresh. Socket keyingi ish.
- **Onboarding hujjatlari** — `documentUrls` maydoni bor; courier app'da R2 upload
  UI (seller `features/uploads` mirror) keyin qo'shiladi.
- **Ko'p vaqtli buyurtma** (`MAX_CONCURRENT > 1`) va kuryer sig'imini sozlash.
- **Temp kontrakt eskirishi** — `expiresAt` o'tgach tozalovchi cron (hozir dispatch
  shunchaki e'tiborga olmaydi).
- **Kuryer reytingi** kontrakt tanlovida (round-robin → reyting-vaznli).
