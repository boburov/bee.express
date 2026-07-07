# Admin paneli — dev server RAM optimizatsiyasi

## Muammo


7.5 GB RAM li mashina + Next.js 16 + Turbopack dev rejimi = `admin` panelni ishga
tushirganda RAM to'lib qolar edi. Swap fayl ham band bo'lar va tizim qotib
qolar edi.

Asosiy sabablar:

1. **Preload entries on start** — Next.js 16'da default'da hamma route'lar
   server boshlanishida xotirага preload qilinadi. `admin` da 14 ta route bor,
   har biri o'z bundle'i bilan — bu boshlanishidayoq ~500 MB qo'shimcha xotira.
2. **Node V8 heap'ning cheklanmaganligi** — `next dev` jarayoni ehtiyojga qarab
   2–3 GB'gacha o'sib ketardi (Linux'da default heap limit 1.7 GB atrofida,
   lekin OS'ning swap'ini ham band qilaverardi).
3. **Server-side source map'lar** — dev rejimida ham generatsiya qilinardi va
   xotirada saqlanardi.
4. **Socket.IO cache bug'i** — `getSocket()` har bir `cached.connected === false`
   holatda yangi socket yaratardi va eski'larining reconnect taymerlari fonda
   davom etardi. Vaqt o'tishi bilan o'nlab "zombie" socket'lar to'planar edi.
5. **Toast `setTimeout` leak'i** — `RealtimeProvider` har bir kelgan
   notification uchun 6 soniyalik taymer yaratardi, lekin komponent unmount
   bo'lganda ularni clear qilmas edi. Closure orqali ushlangan
   `payload`/`setToasts` xotirada saqlanardi.

## Qilingan o'zgarishlar

### `admin/next.config.ts`

```ts
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  turbopack: { root: path.join(__dirname) },
  productionBrowserSourceMaps: false,
  experimental: {
    preloadEntriesOnStart: false, // boshlanishida hamma route'larni preload qilmaslik
    serverSourceMaps: false,       // server source map'lar dev'da xotirada
  },
};
```

- `preloadEntriesOnStart: false` — eng katta ta'sirli flag. Endi `next dev`
  server faqat siz ochgan sahifani compile qiladi va xotirada saqlaydi.
  Boshqa route'ni ochsangiz, o'sha paytda compile bo'ladi (bir necha ms).
- `serverSourceMaps: false` — server tarafdagi xatolar uchun source map endi
  yo'q. Dev'da odatda kerak emas — browser DevTools'idagi client source
  map'lar (`turbopackSourceMaps`, default `true`) o'z joyida.

### `admin/package.json`

```json
"dev":   "NODE_OPTIONS='--max-old-space-size=1536' next dev -p 60001",
"build": "NODE_OPTIONS='--max-old-space-size=2048' next build"
```

- Dev jarayonida V8 heap'i 1.5 GB'dan oshmaydi → bu chegaraga yaqinlashganda
  V8 agressiv garbage collection ishga tushadi, swap'ga chiqib ketmaydi.
- Build uchun 2 GB — production build odatda dev'dan ko'ra ko'proq xotira
  oladi (minify, tree-shake, source map).

### `admin/src/shared/realtime/socket.ts`

`getSocket()` endi token o'zgarmasa cached socket'ni qaytaradi — `connected`
holatini tekshirmaydi. Socket.IO'ning o'zining reconnect logikasi ishini
qiladi (reconnectionAttempts: Infinity).

`disconnectSocket()` ham `removeAllListeners()` chaqiradi — eski
listener'lardan keladigan closure'lar tozalanadi.

### `admin/src/shared/realtime/RealtimeProvider.tsx`

Toast auto-dismiss taymerlari endi `useRef<Map>` ichida saqlanadi.
- Komponent unmount bo'lganda hamma taymerlar `clearTimeout()` bilan
  to'xtatiladi.
- Foydalanuvchi qo'lda yopgan toast'ning taymeri ham clear qilinadi (qayta
  fire bo'lib bekor `setToasts` chaqirmaydi).

## Tekshirish

```bash
free -h     # boshlash oldidan
cd admin && npm run dev
# boshqa terminal'da:
free -h
ps aux | grep next | grep -v grep
```

Kutilgan natija: `next dev` process ~600–900 MB RAM oladi (oldin 1.5–2 GB+
edi va o'sishni davom etardi).

## Qachon "build" qilish kerak

PM2 bilan production'da (`ecosystem.config.js`) hamma app'lar `npm start`
bilan ishlaydi — bu `next start` chaqiradi, dev server emas. Production'da
bu memory muammosi yo'q.

Lokal'da hamma 6 ta app'ni bir vaqtda `npm run dev` qilmang. 7.5 GB RAM
yetmaydi. Aktiv ishlayotgan panelni alohida ishga tushiring:

```bash
npm --prefix admin run dev    # faqat admin
# yoki
npm --prefix seller run dev   # faqat seller
```

## 2-iteratsiya — lucide-react barrel muammosi

Birinchi iteratsiyadan keyin ham RAM to'lib qotib qolishi davom etdi. Sabab:
`lucide-react@1.16.0` paketi `dist/lucide-react.d.ts` da **2.2 MB** type
deklaratsiya va minglab icon eksport qiladi. Hamma fayllarda barrel import
ishlatilgan:

```ts
import { Lock, Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
```

`sideEffects: false` bo'lsa ham, Turbopack dev rejimida har bir sahifa
qayta kompilatsiya bo'lganda barrel index'ni o'qishga majbur — bu RAM ni
bosqichma-bosqich to'ldirib boradi.

### Fix — `optimizePackageImports`

`admin/next.config.ts` ga qo'shildi:

```ts
experimental: {
  optimizePackageImports: ["lucide-react"],
  webpackMemoryOptimizations: true,
}
```

`optimizePackageImports` Next.js'ga import'larni compile vaqtida per-icon
yo'lga (`lucide-react/dist/esm/icons/lock`) qayta yozishni aytadi. Source
kodda hech narsa o'zgartirilmaydi — flag o'zi yetarli.

`webpackMemoryOptimizations` — agar `npm run dev -- --webpack` bilan
fallback qilinsa, max heap'ni kamaytiradi. Turbopack default'da bu flag
e'tibordan tashqari, lekin xavf yo'q.

### Tekshirish — `.next` cache ni tozalab qayta ishga tushiring

```bash
rm -rf admin/.next
npm --prefix admin run dev
```

Birinchi marta sahifalar sekinroq compile bo'lishi mumkin (Turbopack
import grafini qayta quradi), keyingi har bir HMR cycle'da RAM steady
state'da turishi kerak (~600–800 MB).

