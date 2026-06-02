# Bildirishnoma → detail, Telegram tugma, kuryer xaritasi

## 1. In-app bildirishnoma bosilganda detail ochiladi
`features/notifications/` (client/seller/courier) — har bir bildirishnoma `data.link`
ni olib yuradi. Endi:
- **Toast** bosilganda → `router.push(link)` (+ "Buyurtmani ko'rish →" matni).
- **Qo'ng'iroq dropdown**'idagi element bosilganda → o'qilgan deb belgilanadi + `router.push(link)`.
`notificationLink(data)` helper `types.ts` da. Linklar: mijoz `/orders/:id`, sotuvchi
`/dashboard/orders/:id`, kuryer `/dashboard/deliveries/:id`.

## 2. Telegram'da "Buyurtmani ko'rish" tugmasi
Server order-bildirishnomasini Telegram'ga qo'yganda, link prefiksiga qarab to'g'ri
mini-app uchun **absolute URL (deepLink)** quradi (`buildWebAppDeepLink`):
- `/dashboard/deliveries*` → `COURIER_WEBAPP_URL`
- `/dashboard*` → `SELLER_WEBAPP_URL`
- qolgani → `CLIENT_WEBAPP_URL`

Bot (`telegram-worker`) deepLink bo'lsa **"Buyurtmani ko'rish"** inline url tugmasini
qo'shadi — bosilganda o'sha rol mini-appida buyurtma ochiladi. Env o'rnatilmasa, tugmasiz
oddiy matn (graceful). Yangi env: `CLIENT_WEBAPP_URL`, `SELLER_WEBAPP_URL`, `COURIER_WEBAPP_URL`.

## 3. Kuryer detalida ichki xarita + yo'nalish (tracking)
`courier/src/features/deliveries/DeliveryMap.tsx` (yangi, Leaflet — courier'ga `leaflet`
qo'shildi). Kuryer yetkazma detalida:
- **Xarita**: olish (sotuvchi, ko'k pin) + yetkazish (xaridor, brand pin) + ular orasida
  punktir **yo'nalish chizig'i**, ikkalasiga avtomatik fit.
- **"Navigatsiya"** tugmasi → tashqi xarita (Yandex) bilan turn-by-turn yo'nalish.
Oqim: kuryer "Mahsulotni oldim" → xarita orqali yetkazish manziliga boradi → "Yetkazdim".

## Emoji
Barcha bildirishnoma matnlari endi emoji'siz (Lucide ikonlar UI'da tone bo'yicha ko'rsatiladi).
Agar eski bildirishnomalarda emoji ko'rinsa — ular o'zgarishdan oldin DB'ga yozilgan eski
yozuvlar; yangi bildirishnomalar toza. Server qayta deploy bo'lgach yangi matnlar ishlaydi.

## Tekshiruv
- server `tsc`+`nest build` · bot `tsc` · client/seller/admin/courier `tsc` — hammasi toza.
- courier/client `leaflet` o'rnatildi (deploy'da `npm install` qiladi).

## Deploy
- 4 frontend qayta build (courier'da leaflet yangi). server + bot restart. `REDIS_URL`.
- Telegram tugma uchun server `.env` ga `CLIENT_WEBAPP_URL`/`SELLER_WEBAPP_URL`/`COURIER_WEBAPP_URL`.
