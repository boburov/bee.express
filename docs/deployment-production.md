# Production deployment — BeeExpress

Bu hujjat BeeExpress'ni bitta VPS'da (masalan, `161.97.96.229`) productionga
chiqarish bo'yicha to'liq qo'llanma: jarayonlar, env, build, pm2, **HTTPS
(nginx + Let's Encrypt)** va Telegram Mini App talablari.

> ⚠️ **Eng muhim:** Telegram Mini App (xaridor + kuryer) **faqat HTTPS**'da
> ishlaydi. HTTPS sahifa HTTP API'ga so'rov yubora olmaydi (browser "mixed
> content"ni bloklaydi). Ya'ni `http://161.97.96.229:60000/api` bilan client va
> courier ilovalari **ishlamaydi** — domen + TLS shart.

## 1. Jarayonlar va portlar

| Process | Port | Izoh |
|---|---|---|
| server (NestJS API) | `60000` | REST + Socket.IO. `server/.env` `PORT` va `ecosystem.config.js` mos. |
| bot (grammY worker) | — | OTP/queue worker, port ochmaydi |
| admin | `6001` | Web panel |
| client (Mini App) | `60002` | Telegram Mini App (xaridor) |
| seller | `60003` | Web panel |
| courier (Mini App) | `60004` | Telegram Mini App (kuryer) |

## 2. Talablar (VPS)
- Node.js ≥ 20, npm
- MariaDB/MySQL (8+) — `bee_express` bazasi
- Redis
- nginx
- pm2 (`npm i -g pm2`)
- Domen + DNS A-yozuvlari (HTTPS uchun)

## 3. Environment

### 3.1. `server/.env` (productionda)
```ini
NODE_ENV=production
PORT=60000
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/bee_express?allowPublicKeyRetrieval=true"

# Kuchli, tasodifiy qiymatlar — `openssl rand -base64 48`
JWT_ACCESS_SECRET="<random-48>"
JWT_REFRESH_SECRET="<random-48-boshqa>"
JWT_ACCESS_TTL="15m"
JWT_REFRESH_TTL="30d"

# Seed productionda kuchsiz/standart parolni RAD ETADI (min 12 belgi)
SUPERADMIN_USERNAME="..."
SUPERADMIN_PASSWORD="<kuchli-parol>"
SUPERADMIN_FULL_NAME="BeeExpress Owner"

TELEGRAM_BOT_TOKEN="..."
TELEGRAM_BOT_USERNAME="bee_express_bot"

# MAJBURIY: bo'sh qolsa productionda HAMMA cross-origin bloklanadi
CORS_ORIGINS="https://admin.example.uz,https://app.example.uz,https://seller.example.uz,https://courier.example.uz"

OTP_TTL_SECONDS=120
OTP_MAX_ATTEMPTS=5
REDIS_URL="redis://127.0.0.1:6379"

CLOUDFLARE_R2_ACCOUNT_ID="..."
CLOUDFLARE_R2_BUCKET="beeexpress"
CLOUDFLARE_R2_ACCESS_KEY_ID="..."
CLOUDFLARE_R2_SECRET_ACCESS_KEY="..."
CLOUDFLARE_R2_PUBLIC_URL="https://cdn.example.uz"
```

### 3.2. Har bir panel `.env.local`
API URL — **HTTPS domen** orqali:
```ini
# admin/.env.local, seller/.env.local, client/.env.local, courier/.env.local
NEXT_PUBLIC_API_URL=https://api.example.uz/api
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=bee_express_bot   # admin'da kerak emas
```
> `NEXT_PUBLIC_*` build vaqtida bundle'ga "muhrlanadi" — o'zgartirgach **qayta
> build** shart.

## 4. Build va ishga tushirish
```bash
# Har bir paketda
cd server && npm ci && npx prisma migrate deploy && npm run build && cd ..
cd bot    && npm ci && npm run build && cd ..        # agar build kerak bo'lsa
for p in admin seller client courier; do (cd $p && npm ci && npm run build); done

# pm2 bilan hammasini ko'tarish
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # boot'da avtomatik ishga tushirish
```

## 5. nginx reverse proxy + HTTPS

Har bir xizmat alohida subdomenda. Avval DNS A-yozuvlarini VPS IP'ga yo'naltiring:
`api`, `admin`, `app`, `seller`, `courier` → `161.97.96.229`.

`/etc/nginx/sites-available/beeexpress.conf`:
```nginx
# ─── API (NestJS + Socket.IO) ───
server {
  server_name api.example.uz;
  location / {
    proxy_pass http://127.0.0.1:60000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;          # WebSocket (Socket.IO)
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;      # `trust proxy` shu bilan ishlaydi
  }
}

# ─── Panellar (Next.js) — bir xil shablon, port farqi ───
server { server_name admin.example.uz;   location / { proxy_pass http://127.0.0.1:6001;  include /etc/nginx/proxy_params; } }
server { server_name app.example.uz;     location / { proxy_pass http://127.0.0.1:60002; include /etc/nginx/proxy_params; } }
server { server_name seller.example.uz;  location / { proxy_pass http://127.0.0.1:60003; include /etc/nginx/proxy_params; } }
server { server_name courier.example.uz; location / { proxy_pass http://127.0.0.1:60004; include /etc/nginx/proxy_params; } }
```
`/etc/nginx/proxy_params` (mavjud bo'lmasa yarating):
```nginx
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```
TLS sertifikat (Let's Encrypt — certbot avtomatik 443 va redirect qo'shadi):
```bash
sudo ln -s /etc/nginx/sites-available/beeexpress.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.example.uz -d admin.example.uz -d app.example.uz -d seller.example.uz -d courier.example.uz
```

## 6. Telegram Mini App sozlash
1. Client va courier **HTTPS** domenda bo'lishi shart (yuqoridagi `app.` / `courier.`).
2. @BotFather → **Bot Settings → Menu Button / Mini App** → URL: `https://app.example.uz` (xaridor). Kuryer uchun alohida bot yoki menyu: `https://courier.example.uz`.
3. `NEXT_PUBLIC_API_URL` ham `https://api.example.uz/api` bo'lsin (mixed-content bloklanmasligi uchun).

## 7. Hozirgi `http://161.97.96.229:60000` setup haqida
- Admin/seller (web) HTTP/IP'da **texnik jihatdan ochiladi**, lekin JWT
  shifrlanmagan kanalda — xavfli. Faqat ichki/sinov uchun.
- Client/courier (Telegram) HTTP/IP'da **umuman ishlamaydi** (HTTPS majburiy).
- Vaqtinchalik sinov uchun `CORS_ORIGINS`ga IP:port originlarini qo'shish mumkin
  (`server/.env` ichida namuna bor), lekin productionga **domen + HTTPS** shart.

## 8. Deploy'dan oldingi checklist
- [ ] `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` — kuchli tasodifiy (default `change-me-*` EMAS)
- [ ] `SUPERADMIN_PASSWORD` — kuchli (seed productionda kuchsizni rad etadi)
- [ ] `CORS_ORIGINS` — barcha panel domenlari kiritilgan
- [ ] `NODE_ENV=production`
- [ ] Panellar `.env.local` → `https://api.example.uz/api`, keyin qayta build
- [ ] `npx prisma migrate deploy` bajarilgan
- [ ] nginx + certbot HTTPS o'rnatilgan, `nginx -t` muvaffaqiyatli
- [ ] @BotFather'da Mini App URL HTTPS domenga qo'yilgan
- [ ] `pm2 save && pm2 startup`
- [ ] R2 kalitlari to'ldirilgan (rasm yuklash uchun)
- [ ] `npm audit` ko'rib chiqilgan

## 9. Keyingi (tavsiya etiladi)
- Strukturali JSON log + **Sentry** (error tracking) — hozir faqat stdout.
- Ko'p instansli scaling bo'lsa: throttler uchun Redis storage.
- MySQL backup cron (`mysqldump`).
- Docker Compose + CI/CD (hozir qo'lda).
