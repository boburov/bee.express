# PM2 deployment

BeeExpress monoreponing barcha 6 ta servisini bitta PM2 ecosystem orqali boshqarish.

## Fayl

`ecosystem.config.js` (root) — har bir loyiha alohida PM2 app sifatida ro'yxatga olingan.

| App | cwd | Script | Port |
|-----|-----|--------|------|
| `server` | `./server` | `npm run start:prod` (`node dist/main`) | 4000 |
| `bot` | `./bot` | `npm start` (`node dist/index.js`) | — |
| `admin` | `./admin` | `npm start` (`next start`) | 60001 |
| `client` | `./client` | `npm start` (`next start`) | 60002 |
| `seller` | `./seller` | `npm start` (`next start`) | 60003 |
| `courier` | `./courier` | `npm start` (`next start`) | 60004 |

## Birinchi marta ishga tushirish

```bash
# 1. PM2 ni global o'rnatish (agar yo'q bo'lsa)
npm i -g pm2

# 2. Hamma loyihani build qilish
npm run build

# 3. Prisma migratsiya + seed (kerak bo'lsa)
npm run prisma:migrate
npm run db:seed

# 4. Hammasini ishga tushirish
pm2 start ecosystem.config.js
```

## Kundalik buyruqlar

```bash
pm2 status            # barcha apps holati
pm2 logs              # umumiy loglar
pm2 logs server       # faqat server logi
pm2 restart all       # hammasini restart
pm2 restart admin     # faqat admin restart
pm2 stop all          # to'xtatish
pm2 delete all        # ro'yxatdan olib tashlash
```

## Serverda autostart (reboot dan keyin ham ishlasin)

```bash
pm2 save              # joriy holatni saqlash
pm2 startup           # systemd unit yaratish (chiqqan buyruqni sudo bilan bajaring)
```

## Dev mode (ixtiyoriy)

PM2 odatda production uchun. Dev uchun avvalgidek:

```bash
npm run dev   # concurrently orqali 6 ta loyiha hot-reload
```

Agar dev'da ham PM2 kerak bo'lsa, `ecosystem.config.js` da `args` ni `run start:dev` / `run dev` ga almashtirib alohida `ecosystem.dev.config.js` yaratish kerak.

## Eslatma

- `bot` portsiz (Telegram long-polling).
- Har bir Next.js panel `package.json` da `next start -p <PORT>` belgilangan; ecosystem'dagi `PORT` env shu bilan mos kelishi shart.
- `server/.env` da `PORT=4000` bo'lishi kerak (yoki ecosystem'dagi qiymat ustun keladi).
