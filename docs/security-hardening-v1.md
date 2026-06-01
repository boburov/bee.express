# Xavfsizlik hardening v1

Production auditidan keyin server xavfsizligini mustahkamlash. Audit toza
build, mustahkam auth (JWT refresh, RBAC, Telegram HMAC, OTP limit) va input
validation topdi; asosiy teshiklar **infratuzilma darajasida** edi (CORS, rate
limit, error leak, headers). Shu bosqichda ular yopildi.

## Qilingan ishlar

### 1. CORS allow-list (REST + WebSocket)
- `src/common/cors.ts` — yagona manba. `CORS_ORIGINS` (vergulli ro'yxat)dan
  o'qiydi. Bo'sh bo'lsa: **production → bloklash (`false`)**, dev → reflect (`true`).
- `main.ts` va `notifications.gateway.ts` endi `origin: true` ishlatmaydi.
- `main.ts`da `app.use(helmet())`dan oldin `dotenv/config` import qilindi — WS
  gateway dekoratori import vaqtida `CORS_ORIGINS`ni ko'rishi uchun.
- `trust proxy = 1` — nginx orqasida real client IP (rate limit uchun).

### 2. Rate limiting (`@nestjs/throttler`)
- Global default: **300 req/min** har IP (`ThrottlerGuard` APP_GUARD, auth'dan oldin).
- Qattiqroq route'lar (`@Throttle`):
  - `POST /auth/phone/request` — **3/min** (OTP spam + pul sarfini to'xtatadi)
  - `POST /auth/phone/verify` — 10/min (brute-force tezligini cheklaydi)
  - `POST /auth/super-admin/login` — 5/min (parol brute-force)
- Tasdiqlangan: 4-chi OTP so'rovi → **429** (live test).

### 3. Global exception filter
- `src/common/all-exceptions.filter.ts` — stack trace / Prisma SQL / jadval
  nomlari mijozga **sizib chiqmaydi** (faqat server logiga). Kutilgan Prisma
  xatolari toza xabarlarga map qilinadi: `P2002`→409, `P2025`→404, `P2003`→400.
  Qolgani → umumiy 500 "Server xatosi".

### 4. Security headers + request log
- `helmet()` — HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options:
  SAMEORIGIN` va h.k. (live test'da tasdiqlandi). CSP o'chirilgan (JSON API).
- `src/common/request-logger.ts` — har so'rov: method, path, status, latency.

### 5. Super-admin parol hardening
- `prisma/seed.ts` — productionda kuchsiz/standart parolni (`<12` belgi yoki
  `ChangeMe!2026` kabi) **rad etadi** (throw). Seed allaqachon idempotent
  (mavjud bo'lsa o'tkazadi) va env-driven edi.

### 6. Tuzatishlar
- **Kuryer Telegram SDK**: `courier/src/app/layout.tsx`ga
  `telegram-web-app.js` (`beforeInteractive`) qo'shildi — client bilan par?itet.
- **pm2 port nomuvofiqligi**: `ecosystem.config.js` server `PORT` `4000` → **`60000`**
  (`.env` va panellar `NEXT_PUBLIC_API_URL` bilan mos).
- `.env` / `.env.example` — `CORS_ORIGINS` namuna + kuchli secret eslatmalari.

## Yangi env o'zgaruvchisi
| Var | Majburiy | Izoh |
|---|---|---|
| `CORS_ORIGINS` | **production'da HA** | Panel originlari (vergulli). Bo'sh = prod'da hamma cross-origin bloklanadi. |

## Tekshiruv (live)
```
Helmet:           HSTS + nosniff + X-Frame-Options SAMEORIGIN  ✓
Rate limit:       /auth/phone/request → #4 = 429               ✓
Exception filter: malformed JSON → toza 400, stack yo'q        ✓
Courier guard:    /api/courier/available → 401                 ✓
server tsc/build + courier next build                          ✓
```

## Hali qolgani (xavfsizlik/infra)
- **HTTPS/TLS** — `docs/deployment-production.md` (nginx + Let's Encrypt). Telegram
  Mini App uchun MAJBURIY. Bu serverda emas, deploy bosqichida.
- Kuchli `JWT_*` secret va `SUPERADMIN_PASSWORD` productionda (hozir `.env`da
  `change-me-*` — local dev uchun).
- Strukturali JSON log + **Sentry** (error tracking).
- Ko'p instans bo'lsa: throttler uchun Redis storage.
- `npm audit`: o'rnatishda 3 ta moderate ogohlantirish — ko'rib chiqilsin.
- MySQL backup cron, Docker/CI-CD.
