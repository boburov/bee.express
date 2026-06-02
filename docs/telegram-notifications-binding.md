# Telegram bog'lanish (/start) + bildirishnomalar

## 1. `/start` → raqam + telegramId bog'lanishi (allaqachon mavjud)

`bot/src/bot.ts` da to'liq yozilgan (yangi emas):
- **`/start`** — agar telegramId allaqachon real raqamga bog'langan bo'lsa, salomlashadi;
  aks holda **"📱 Telefon raqamni ulashish"** tugmasini ko'rsatadi (`contactKeyboard`).
- **`:contact`** (raqam ulashilganda, `handleContact`) — raqamni normalize qiladi va:
  - raqam bo'yicha User topilsa → unga `telegramId` (+ username/ism/`telegramLinkedAt`) yoziladi;
  - telegramId bo'yicha User topilsa (Mini App placeholder) → `phone` to'ldiriladi;
  - hech biri bo'lmasa → yangi User yaratiladi.
- Schema: `User.phone @unique`, `User.telegramId @unique` + `telegramUsername/First/Last/LinkedAt`.

Ya'ni foydalanuvchi botda `/start` bosib raqamini ulashsa, **telegramId o'sha raqamli
User'ga bog'lanib qoladi**. Bu — Telegram'ga xabar yuborishning sharti.

## 2. Bildirishnomalar Telegram'ga (F2 — kengaytirildi)

`NotificationsService.send()` har bir bildirishnomani (in-app row + WS push'dan tashqari)
**Telegram'ga ham** navbatga qo'yadi — `telegramId` bog'langan qabul qiluvchilar uchun.
Avval faqat `data.link` bor (order) xabarlar uchun edi; endi **barcha** bildirishnomalar,
shu jumladan **admin broadcast/e'lon** ham boradi (`server/src/notifications/notifications.service.ts` `pushTelegram`).

Oqim: `send()` → `TG_NOTIFY_QUEUE` (`TelegramQueueService`) → bot `runTelegramWorker`
(`tgBlockingRedis` BLPOP) → `bot.api.sendMessage`. Best-effort.

## To'liq zanjir
`/start` + raqam ulashish → `User.telegramId` bog'lanadi → istalgan bildirishnoma
(buyurtma holati, admin e'lon, kuryerga "buyurtma keldi") → Telegram'ga keladi.

## Ishlashi uchun (deploy)
- **bot** VPS'da yangi kod bilan qayta ishga tushirilsin (`runTelegramWorker` qo'shildi).
- **server** qayta ishga tushirilsin (queue + gate).
- Redis (queue) ulanishi bo'lsin (`REDIS_URL`).
- Foydalanuvchi bir marta botda `/start` bosib raqam ulashgan bo'lsin.

## Tekshiruv
- server `tsc` + `nest build` toza; bot `tsc` toza.
