# Order lifecycle bildirishnomalari — backend (W2, TZ §9)

## Muammo

TZ §9: har bir holat o'zgarishida xaridor, sotuvchi va kuryerga bildirishnoma
borishi kerak. Amalda **butun order lifecycle jim** edi — yagona transition-vaqt
bildirishnomasi `DispatchService.onOrderReady` bo'lib, u faqat **kuryerga** (auto-assign)
xabar berardi. Yangi buyurtmada sotuvchiga, status o'zgarishida mijozga — hech narsa
bormasdi. `OrdersService` ham, `CourierService` ham `NotificationsService` ni inject
qilmagandi.

## Yechim (backend)

### Yangi: `OrderNotifierService`
`server/src/notifications/order-notifier.service.ts` — order holatini to'g'ri
qabul qiluvchilarga va matnga (Uzbek) bog'laydigan yagona joy. Faqat
`PrismaService` + `NotificationsService` ga bog'liq, shuning uchun ikkala servis
(Orders, Courier) uni siklsiz inject qila oladi. `NotificationsModule` da
provide + export qilingan.

- `newOrder(orderId)` — yangi buyurtma → sotuvchiga (`Store.ownerId`) xabar.
- `statusChanged(orderId, status)` — mijozga (har bir status uchun matn) + sotuvchiga
  (COURIER_ASSIGNED / DELIVERED / CANCELLED da).

Har bir send **best-effort** (`.catch`) — push xatosi statusni hech qachon orqaga qaytarmaydi
(`DispatchService` bilan bir xil fire-and-forget shartnoma). Har bir bildirishnoma
`data.link` ham olib yuradi (mijoz: `/orders/:id`, sotuvchi: `/dashboard/orders/:id`).

### Ulanishlar
- `OrdersService.checkout` — yaratilgan har bir buyurtma uchun `newOrder()` (sotuvchiga).
- `OrdersService.transitionStatus` — har bir o'tishdan keyin `statusChanged()`
  (sotuvchi ACCEPTED/PREPARING/READY/REJECTED/CANCELLED + mijoz cancel shu yerdan o'tadi).
- `CourierService.accept` — `statusChanged(COURIER_ASSIGNED)` (mijoz + sotuvchi).
- `CourierService.updateStatus` — `statusChanged(ON_WAY|DELIVERED)` (mijoz + DELIVERED'da sotuvchi).

### Ochiq pool (W2.6)
`DispatchService.onOrderReady` — kontraktli kuryer bo'lmasa, endi ROLE='courier'
bo'yicha barcha kuryerlarga "yangi buyurtma bo'sh navbatda" xabari ketadi (avval
bu holatda jim qaytardi). Online filtri NotificationsService ichida emas — MVP
bitta tuman uchun maqbul.

## Yangi/o'zgargan fayllar
- yangi: `server/src/notifications/order-notifier.service.ts`
- `server/src/notifications/notifications.module.ts` — provider + export
- `server/src/orders/orders.module.ts` — `NotificationsModule` import
- `server/src/orders/orders.service.ts` — inject + checkout + transitionStatus
- `server/src/courier/courier.service.ts` — inject + accept + updateStatus
- `server/src/contracts/dispatch.service.ts` — ochiq pool ROLE notify (`notifyRole`)

## Tekshiruv
- `tsc --noEmit` toza · `nest build` toza · modul grafida sikl yo'q
  (`NotificationsModule` hech kimni import qilmaydi; `Orders`/`Courier`/`Contracts`
  uni bir yo'nalishda import qiladi).
- Lint: yangi fayl prettier-toza. O'zgargan servislarda qolgan prettier xatolari
  pre-existing (HEAD baseline: courier 23, dispatch 9) — tegilmagan.

## Frontend — polling (W2-frontend)

Egasi tanlovi: **polling (yangi kutubxona yo'q)**, socket emas. Har bir app'ning
order ko'rinishlari ~15s'da fonda yangilanadi, shunda status o'zgarishlari
ko'rinadi (DB notification + WS emit baribir yoziladi; faqat admin socketga ulanadi).

Pattern: har bir hook'ning `reload` funksiyasiga ixtiyoriy `silent?: boolean`
qo'shildi — `silent === true` bo'lganda `loading` flag'i o'zgarmaydi, shuning
uchun fon yangilanishi spinner chaqirmaydi. Yangi `useEffect` `setInterval(reload(true), 15s)`
ni `document.hidden` bo'lmaganida ishlatadi (tab ko'rinmas bo'lsa to'xtaydi).

O'zgargan hook'lar:
- `seller/src/features/orders/hooks.ts` — `useSellerOrders` (yangi buyurtma + status), `useSellerOrder` (kuryer ON_WAY/DELIVERED).
- `client/src/features/orders/hooks.ts` — `useOrders`, `useOrder` (mijoz status'ni bosqichma-bosqich ko'radi).
- `courier/src/features/deliveries/hooks.ts` — `useAvailableOrders` (yangi pool), `useMyOrders` (aktiv).

`reload()` argumentsiz chaqiruvlari (manual "Yangilash" tugmalari, mutatsiyadan
keyingi reload) o'zgarishsiz ishlaydi — `silent` faqat `=== true` da yoqiladi,
shuning uchun event handler sifatida o'tkazilsa ham xavfsiz.

Tekshiruv: client/seller/courier — `tsc --noEmit` toza. Yangi polling kodi
lint-toza; qolgan `set-state-in-effect` / react-compiler xatolari pre-existing
(HEAD baseline'da ham bor).

## Keyinga qoldirildi (ixtiyoriy)
- Bildirishnoma "qo'ng'irog'i" / inbox UI (`/notifications/mine`) — hozir status
  order ko'rinishlarida ko'rinadi, alohida bell yo'q.
- Terminal holatda (DELIVERED/CANCELLED) pollingni to'xtatish — hozir oddiylik
  uchun davom etadi.
- Telegram push (W2.7) — hozircha faqat in-app/WS.
