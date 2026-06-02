# Sotuvchi kuryer biriktirish + Telegram xabar + transport badge

## F1 — Sotuvchi READY buyurtmaga kuryer biriktiradi

Avval kuryer biriktirish faqat **avtomatik** (dispatch) edi. Endi sotuvchi
o'zining **faol kontraktli** kuryerlaridan birini qo'lda tanlab biriktira oladi.
Yakuniy holat avto-biriktirish bilan bir xil: READY → COURIER_ASSIGNED, `courierId`,
`courierEarning` snapshot, history row, kuryerga xabar.

**Backend:**
- `DispatchService.assignToCourier(orderId, courierId, actorId)` — `onOrderReady`
  mexanizmini qayta ishlatadi (atomic claim + earning + history `'Sotuvchi biriktirdi'`
  + kuryerga `notifyMany`). Validatsiya: order READY+biriktirilmagan, kuryer do'kon
  bilan ACTIVE kontraktga ega. Mijozga ham xabar (`OrderNotifierService.statusChanged`,
  self-accept bilan parity).
- `OrdersService.assignCourierForStore(orderId, storeId, sellerId, courierId)` — egalik
  tekshiruvi + dispatch chaqiruvi.
- `POST /seller/orders/:id/assign-courier` (`@Roles('seller')`, `AssignCourierDto`).
- `order.serializer.ts` ga `courierId` + `courierAssignedAt` qo'shildi (UI biriktirilgan kuryerni ko'rsatishi uchun).

**Frontend (seller):**
- `sellerOrdersApi.assignCourier(id, courierId)`.
- Order detail (`/dashboard/orders/[id]`): READY+biriktirilmagan bo'lsa
  **"Kuryerga biriktirish"** kartasi — faol kontraktli kuryerlar (online birinchi),
  har biri transport badge + online holati + "Biriktirish" tugmasi. Biriktirilgach
  **"Biriktirilgan kuryer"** kartasi (nom + transport + qo'ng'iroq).

## F2 — Telegram bot xabari (order eventlari)

Avval bot faqat OTP yuborardi. Endi order eventlari Telegramga ham boradi
(kuryerga "sizga buyurtma keldi", mijozga status, va h.k.).

- **Server:** yangi `TG_NOTIFY_QUEUE` + `TelegramQueueService` (OTP queue patterni).
  `NotificationsService.send()` — WS push'dan keyin, **`data.link` bo'lgan** (order)
  bildirishnomalar uchun, qabul qiluvchilarning `telegramId`'sini topib navbatga
  qo'yadi. Best-effort (in-app row asosiy manba). Admin broadcast (link yo'q) Telegramga ketmaydi.
- **Bot:** yangi `runTelegramWorker` (alohida `tgBlockingRedis` ulanish, chunki ioredis
  per-connection serializatsiya qiladi) `TG_NOTIFY_QUEUE`'ni BLPOP qilib `sendMessage`.
  `index.ts` da OTP worker yonida ishga tushadi + shutdown'da tozalanadi.

## F4 — Transport badge (prominent)

Sotuvchi Kuryerlar/biriktirish ro'yxatida transport endi **kichik matn emas**,
balki ikonka+yorliqli badge (`TransportBadge` + `TRANSPORT_META`: Piyoda/Velosiped/
Mototsikl/Mashina/Yuk mashinasi). Ariza/biriktirish paytida transport darhol ko'rinadi.

## Yangi/o'zgargan fayllar
- server: `contracts/dispatch.service.ts`, `orders/orders.service.ts`,
  `orders/dto/assign-courier.dto.ts` (yangi), `seller/orders/seller-orders.controller.ts`,
  `orders/order.serializer.ts`, `queue/{queue.types.ts,telegram-queue.service.ts(yangi),queue.module.ts}`,
  `notifications/notifications.service.ts`
- bot: `queue.ts`, `redis.ts`, `telegram-worker.ts` (yangi), `index.ts`
- seller: `features/contracts/{transport.ts,TransportBadge.tsx}` (yangi),
  `app/dashboard/contracts/page.tsx`, `app/dashboard/orders/[id]/page.tsx`,
  `features/orders/{api.ts,types.ts}`

## Tekshiruv
- server `tsc` + `nest build` toza (DI: TelegramQueueService, OrderNotifier+DispatchService).
- bot `tsc` toza. seller `tsc` toza; yangi kod lint-toza (qolgan 2 ta `no-unescaped`
  apostrof — `So'ralgan`/`To'lov` — pre-existing, HEAD'da ham bor).

## Eslatma
- Telegram ishlashi uchun bot prod'da ishlab turishi + foydalanuvchi telefon OTP orqali
  kirgan (telegramId bog'langan) bo'lishi kerak. Redis (queue) ulanishi sozlangan bo'lsin.
