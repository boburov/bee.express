# Realtime notifications v1 (2026-05-25)

Admin paneldan istalgan foydalanuvchiga (sotuvchi/kuryer/xaridor — yoki rol
bo'yicha, yoki broadcast) **realtime** push xabar yuborish. Socket.IO orqali
yetkazib beriladi, DB'ga saqlanadi, foydalanuvchi offline bo'lsa keyin
to'ldiriladi.

## Arxitektura

```
┌────────────────────┐                          ┌─────────────────────────┐
│  Admin (browser)   │  POST /admin/notifications  │  NestJS REST            │
│  /dashboard/       │ ───────────────────────► │  NotificationsController│
│   notifications    │                          │      │                  │
└────────────────────┘                          │      ▼                  │
                                                 │  NotificationsService   │
                                                 │   ├── DB: createMany    │
                                                 │   ├── Gateway.pushToUser│
                                                 │   └── recompute unread  │
                                                 │      │                  │
                                                 │      ▼                  │
                                                 │  Socket.IO Server       │
                                                 │  (path: /socket.io)     │
                                                 └────────┬────────────────┘
                                                          │  emit("notification:new")
                ┌───────────────────────────┬─────────────┴─────────────┐
                ▼                           ▼                           ▼
        ┌─────────────┐           ┌─────────────┐             ┌─────────────┐
        │  client app │           │  seller app │             │ admin (self)│
        │  user:<id>  │           │  user:<id>  │             │  broadcast  │
        └─────────────┘           └─────────────┘             └─────────────┘
```

## Schema (migration `20260525112429_add_notifications`)

```prisma
enum NotificationType       { INFO SUCCESS WARNING DANGER ANNOUNCE }
enum NotificationChannel    { IN_APP TELEGRAM }
enum NotificationSenderType { SUPER_ADMIN USER SYSTEM }

model Notification {
  id            String   @id @default(cuid())
  recipientId   String                // → User (cascade)
  senderType    NotificationSenderType
  senderId      String?               // null for SYSTEM

  title         String
  body          String?  @db.Text
  type          NotificationType @default(INFO)
  data          Json?                 // free-form: { link, orderId, ... }

  delivered     Boolean  @default(false)
  telegramSent  Boolean  @default(false)
  readAt        DateTime?

  groupId       String?               // shared across one logical send
  createdAt     DateTime @default(now())

  @@index([recipientId, readAt])
  @@index([recipientId, createdAt])
  @@index([groupId])
}
```

**Fan-out strategy:** har bir qabul qiluvchi alohida row oladi. Bu `findMany
by recipient` ni indekslangan tezda qiladi va per-user read state ni
soddalashtiradi. 100k+ broadcast'larda — `NotificationBroadcast` +
`NotificationRead` join'iga ko'chiramiz (hozircha shart emas).

## Endpointlar (6 ta yangi)

### Admin (SuperAdmin only)
| Method | Path | Body | Maqsad |
|---|---|---|---|
| POST | `/api/admin/notifications` | `{ target, userIds?, roleSlug?, title, body?, type?, data? }` | Yuborish |
| GET | `/api/admin/notifications` | — | Tarix (`groupId` bo'yicha aggregat) |

`target` 3 ta:
- `USER` + `userIds: ["..."]` — bir nechta foydalanuvchi
- `ROLE` + `roleSlug: "seller"` — rol bo'yicha barcha bloklanmagan
- `BROADCAST` — barcha bloklanmagan user'lar

### Recipient (auth)
| Method | Path | Maqsad |
|---|---|---|
| GET | `/api/notifications/mine?unreadOnly&page&pageSize` | Sahifalangan ro'yxat + total + unread |
| GET | `/api/notifications/unread-count` | `{ count }` |
| PATCH | `/api/notifications/:id/read` | O'qildi belgilash |
| POST | `/api/notifications/read-all` | Hammasini o'qildi |

## Socket.IO

### Connection
```
ws://host/socket.io?token=<accessToken>
```
Yoki `auth: { token }` Socket.IO option orqali (admin client shu yo'lni ishlatadi).

JWT `JWT_ACCESS_SECRET` bilan tekshiriladi (AuthModule bilan bir xil). Yo'q
yoki noto'g'ri bo'lsa darhol disconnect.

### Rooms
- `user:<userId>` — har bir foydalanuvchi uchun shaxsiy.
- `admin:<superAdminId>` — super admin uchun.
- `role:<slug>` — `seller`, `courier`, `customer`, …
- `broadcast` — har kim (auth) joinlanadi.

### Events

**Server → client:**
- `notification:new` — `{ id, title, body, type, data, groupId, createdAt }`
- `notification:unread_count` — `{ count }`

**Client → server:**
- `notification:mark_read` — `{ id }` (REST `/notifications/:id/read` haqiqatga manba)

## Admin UI

`/admin/dashboard/notifications` — Sidebar'da "Operatsiya" bo'limida.

**Send form:**
- Target tab'lari: Hammaga / Rol bo'yicha / Aniq foydalanuvchilar
- USER tab'da search input + chip'lar (debounced /admin/users qidiruv)
- ROLE tab'da rol select (system rollarni o'z ichiga oladi)
- BROADCAST tab'da ogohlantirish banner
- Title (140 belgi limit) + Body (4000 belgi limit) + Type select
- Submit → POST → muvaffaqiyat banner: "Yuborildi: N ta foydalanuvchi"

**History list:**
- groupId bo'yicha aggregat — har bir send bitta kart
- recipients / delivered / read sonlari
- yuborilgan sana/vaqt
- type badge bilan vizual ajratish

## Admin realtime toast

`DashboardShell` ichida `<RealtimeProvider>` + `<RealtimeToasts>`:
- Login keyin socket avtomatik ulanadi (`getSocket(accessToken)`).
- Token refresh bo'lsa qaytadan ulanadi (token cache invalidation).
- Logout → disconnect.
- `notification:new` → bottom-right toast (oxirgi 4 ta), 6s avto-dismiss,
  manual yopish tugmasi.
- Type'ga qarab tone (INFO=sky, SUCCESS=green, WARNING=amber, DANGER=red,
  ANNOUNCE=brand).

Admin BROADCAST yuborganda o'zi ham toastni ko'radi — birinchi sinov sifatida.

## Smoke test

```bash
# 1. Single user
curl -X POST http://localhost:4000/api/admin/notifications \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"target":"USER","userIds":["user_xxx"],"title":"Salom","type":"INFO"}'
# → { "groupId": "...", "recipients": 1, "skipped": 0 }

# 2. By role
curl ... -d '{"target":"ROLE","roleSlug":"seller","title":"E‘lon","type":"ANNOUNCE"}'
# → { "recipients": 2, ... }

# 3. Broadcast
curl ... -d '{"target":"BROADCAST","title":"Tizim sinovi","type":"INFO"}'
# → { "recipients": 3, ... }

# 4. History
curl http://localhost:4000/api/admin/notifications?pageSize=5 -H "Authorization: ..."
```

## Texnik qarz / kelajak

- **Telegram fallback** — `Notification.telegramSent` field tayyor. Keyingi
  sprint'da OTP queue pattern bilan: agar user offline (`delivered=false`),
  N daqiqadan keyin bot orqali ham yuboramiz.
- **Push bildirishnoma (PWA / browser push)** — Service Worker + Web Push API.
- **Per-user/per-type opt-out** — `NotificationPreference` model.
- **Markdown body** + harakat tugmalari (`data.actions: [{ label, url }]`).
- **Bell UI in client/seller/courier** — admin'da realtime toast bor, lekin
  sotuvchi/kuryer/xaridor panellarida bell + dropdown hali yo'q. Pattern
  admin'dan ko'chiriladi.
- **Notification group detail page** — yuborilganlar tarixidan kim o'qigan,
  kim hali o'qimagan ekanini ko'rsatuvchi sahifa.
- **Rate limiting** — bir admin minutiga 60 ta broadcast'dan ko'p yubora
  olmaydi.
