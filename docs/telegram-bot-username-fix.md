# Telegram bot username tuzatildi

## Muammo

Loyiha bo'ylab Telegram bot username'i bir nechta xil yozilgan edi va default/`.env` qiymatlari noto'g'ri (`bee_express_bot`) bo'lib, login (OTP) havolalari `https://t.me/bee_express_bot` ga olib borardi — bu mavjud bo'lmagan bot.

Aniqlangan uchta xil yozilish:

| Manba | Eski qiymat |
| --- | --- |
| `bot/.env` | `BeeExpressBot` (to'g'ri) |
| `server/.env`, frontend `.env.local` | `bee_express_bot` |
| Kod default'lari (`env.ts`, `config.ts`) | `bee_express_bot` |

## Yechim

Hamma joy bitta to'g'ri username'ga keltirildi: **`BeeExpressBot`** (`https://t.me/BeeExpressBot`).

O'zgartirilgan fayllar:

- Kod default fallback'lari:
  - `client/src/shared/config/env.ts`
  - `seller/src/shared/config/env.ts`
  - `courier/src/lib/env.ts`
  - `bot/src/config.ts`
- Env namunalari / haqiqiy env:
  - `server/.env`, `server/.env.example`
  - `bot/.env.example`
  - `courier/.env.local`, `client/.env.local`, `seller/.env.local`
- Hujjatlar:
  - `docs/deployment-production.md`
  - `docs/seller-panel-refresh.md`

> `bot/.env` allaqachon to'g'ri (`BeeExpressBot`) bo'lgani uchun o'zgartirilmadi.

## Eslatma

Login havolasi `https://t.me/${botUsername}` ko'rinishida quriladi (client/seller/courier panellarida). Ishlab chiqarishda (production) `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` qiymati ham `BeeExpressBot` ekanligiga ishonch hosil qiling.
