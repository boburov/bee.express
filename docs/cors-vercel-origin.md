# CORS — Vercel frontend (`https://bee-express.vercel.app`) uchun ruxsat

## Muammo

`https://bee-express.vercel.app` da deploy qilingan frontend production API
(`NODE_ENV=production`) ga so'rov yuborganda CORS bloklaydi. Sabab:

- CORS yagona manbadan boshqariladi: [server/src/common/cors.ts](../server/src/common/cors.ts).
- Allow-list `CORS_ORIGINS` env'dan keladi. U `server/.env` da bo'lib,
  **gitignore** qilingan — faqat serverning o'zida yashaydi.
- Production'da `CORS_ORIGINS` bo'sh bo'lsa, ilgari **barcha** cross-origin
  so'rovlar bloklanardi (credentials bilan reflect-any qilish CSRF xavfi).

PM2 ([ecosystem.config.js](../ecosystem.config.js)) serverni `NODE_ENV=production`
bilan ishga tushiradi, lekin `CORS_ORIGINS` ni qo'ymaydi.

## Yechim

Ishonchli production frontend origin'lari endi **kodga** default sifatida
kiritildi (`ALWAYS_ALLOWED_ORIGINS`), shuning uchun deploy'dan keyin serverdagi
`.env` ga tegmasdan ham ishlaydi:

```ts
const ALWAYS_ALLOWED_ORIGINS = ['https://bee-express.vercel.app'];
```

Yangi xatti-harakat (`corsOrigins()`):

| Holat                                   | Natija                                  |
| --------------------------------------- | --------------------------------------- |
| dev + `CORS_ORIGINS` bo'sh              | barcha origin reflect (lokal qulaylik)  |
| prod + `CORS_ORIGINS` bo'sh             | faqat `ALWAYS_ALLOWED_ORIGINS`          |
| prod/dev + `CORS_ORIGINS` to'ldirilgan  | env ro'yxati **+** `ALWAYS_ALLOWED_ORIGINS` (dedup) |

> **Eslatma:** brauzerning `Origin` sarlavhasida oxirgi `/` va yo'l bo'lmaydi —
> shuning uchun ro'yxatda faqat `scheme + host` ko'rsatiladi
> (`https://bee-express.vercel.app`, `.../` emas).

## Boshqa panellarni qo'shish

Admin/seller/courier kabi qo'shimcha origin'lar uchun serverdagi
`server/.env` da `CORS_ORIGINS` ni to'ldiring (vergul bilan ajratilgan):

```
CORS_ORIGINS=https://admin.beeexpress.uz,https://app.beeexpress.uz,https://seller.beeexpress.uz,https://courier.beeexpress.uz
```

Bu ro'yxat kodadagi default bilan birlashtiriladi, ya'ni Vercel app baribir
ishlaydi.

## Tegishli fayllar

- [server/src/common/cors.ts](../server/src/common/cors.ts) — yagona CORS manbai
- [server/src/main.ts](../server/src/main.ts) — REST `app.enableCors(corsOptions())`
- [server/src/notifications/notifications.gateway.ts](../server/src/notifications/notifications.gateway.ts) — Socket.IO ham shu `corsOptions()` dan foydalanadi
- [server/.env.example](../server/.env.example) — `CORS_ORIGINS` hujjati
