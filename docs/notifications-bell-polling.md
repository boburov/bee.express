# Notification bell + 5s polling + toast (F5)

Talab: hamma panelda bildirishnoma bo'limi bo'lsin; real-time bo'lmasa ham har
5 sekundda DB'dan olib tursin va toast ko'rsatsin.

## Yondashuv
Egasi **polling** ni tanladi (socket emas, yangi dep yo'q). Backend allaqachon
tayyor: `GET /notifications/mine`, `/notifications/unread-count`,
`PATCH /notifications/:id/read`, `POST /notifications/read-all`.

Har bir app uchun bir xil `features/notifications/` to'plami:
- `api.ts` — yuqoridagi endpointlar.
- `NotificationsProvider.tsx` — har **5s** `unread-count` so'raydi (`document.hidden`
  bo'lsa to'xtaydi). Soni oshsa, ro'yxatni oladi va yangi (ko'rilmagan) elementlarni
  **toast** qiladi. Birinchi yuklashda backlog toast qilinmaydi (seed).
- `NotificationBell.tsx` — qo'ng'iroq + o'qilmagan badge + dropdown ro'yxat
  (o'qilganini belgilash, "Hammasini o'qildi").
- `ToastStack.tsx` — pastki o'ng burchakda toast'lar (admin `RealtimeToasts` patterni).

## Panellar
- **client** (`@/shared/auth/*`, `@/shared/lib/cn`): provider `AppShell`'da, bell Topbar'da.
- **seller** (xuddi shu yo'llar): provider `DashboardShell`'da, bell Topbar'da (o'ng).
- **courier** (`@/lib/api`, `@/lib/auth-store`, `@/lib/cn`): provider+toast `dashboard/layout`'da, bell header'da.
- **admin**: allaqachon **socket realtime** (`shared/realtime` + `RealtimeToasts`) bor — o'zgartirilmadi (super-admin'da shaxsiy notification yo'q).

Telegram push (F2) bilan birga: order eventlarida foydalanuvchi ham in-app/WS/poll,
ham Telegram orqali xabar oladi.

## Tekshiruv
- client/seller/courier `tsc` + yangi kod lint toza. Backend o'zgarmadi.
