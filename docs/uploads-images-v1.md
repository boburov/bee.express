# Rasm yuklash (uploads) v1 — mahsulot yuklashni ishga tushirish

Mahsulot yaratish backend'i **kamida bitta rasm** talab qiladi (TZ §7.1), lekin
ilgari sotuvchi formasida rasm yuklash UI yo'q edi, R2 esa sozlanmagan — natijada
sotuvchi UI orqali umuman mahsulot qo'sha olmasdi. Bu hujjat shu zanjirni
**tashqi xizmatsiz** (lokal disk) ishlaydigan qildi.

## Muammo (oldin)
- `POST /seller/products` → `imageUploadIds` bo'sh bo'lsa **400 "Kamida bitta rasm kerak"**.
- "Yangi mahsulot" formasi rasm yubormaydi; edit'da "Image upload tez orada (R2 sozlangach)".
- `CLOUDFLARE_R2_*` bo'sh → presign/complete **503**.

## Yechim — direct multipart upload (lokal disk + R2)

### Backend
- **`POST /uploads/direct`** (`multipart/form-data`: `file` + `purpose`) — bitta
  so'rovda faylni saqlaydi va **READY** `UploadedFile` qaytaradi (`{ id, url, ... }`).
  `FileInterceptor` (memory storage), 8 MB limit, mime/size policy bilan tekshiruv.
- **`UploadsService.directUpload`** — storage-agnostik:
  - `CLOUDFLARE_R2_*` sozlangan bo'lsa → `R2Client.putObject` (yangi metod), `url = publicUrlFor(key)`.
  - aks holda → **lokal disk** (`UPLOADS_DIR`, default `<server>/uploads-data`),
    `url = <UPLOADS_PUBLIC_BASE_URL>/uploads-static/<key>`.
- **Static serving**: `main.ts` → `useStaticAssets(localUploadsDir(), { prefix: '/uploads-static/' })`
  (`/api` prefiksidan tashqarida).
- **CORP**: helmet `crossOriginResourcePolicy: 'cross-origin'` — panellar (boshqa
  origin) `<img>` orqali yuklay olishi uchun.
- Eski presign/complete (R2'ga to'g'ridan) yo'li o'zgarmadi.

### Frontend (seller)
- `features/uploads/api.ts` → `uploadImage(file, purpose)` (`api.postForm` — axios
  multipart boundary'ni o'zi qo'yadi).
- `features/uploads/ImageUploader.tsx` — ko'p rasm tanlash, darhol yuklash,
  thumbnail + o'chirish, `{id,url}[]` boshqaradi.
- **Yangi mahsulot** (`products/new`): rasm kartasi qo'shildi, **≥1 rasm majburiy**,
  `imageUploadIds` create dto'ga uzatiladi.
- **Mahsulot tahrirlash** (`products/[id]`): "tez orada" o'rniga mavjud rasmlar
  + ImageUploader + "saqlash" (update `imageUploadIds` — backend mavjudiga qo'shadi).

## Yangi env
| Var | Default | Izoh |
|---|---|---|
| `UPLOADS_DIR` | `<server>/uploads-data` | Lokal saqlash papkasi (gitignored) |
| `UPLOADS_PUBLIC_BASE_URL` | `http://localhost:<PORT>` | Static fayllar uchun PUBLIC origin. Prod'da API domeni/IP. |

> R2 ishlatmoqchi bo'lsangiz — `CLOUDFLARE_R2_*` to'ldiring; direct upload
> avtomatik R2'ga o'tadi, kod o'zgarmaydi.

## Tekshiruv (live e2e)
```
POST /uploads/direct (multipart)         -> 200  {id, url}
GET  <url> (static)                      -> 200  image/png, CORP=cross-origin
POST /seller/products (imageUploadIds)   -> 201  images=1, status=PENDING   ← oldin 400 edi
seller `next build`                      -> ✓
```

## Keyingi qadamlar
- Do'kon logo/banner + avatar + sharh rasmlari ham shu `directUpload`'dan
  foydalanishi mumkin (purpose'lar tayyor).
- Orphan (biriktirilmagan) `UploadedFile` larni tozalovchi cron.
- Productionda: `UPLOADS_PUBLIC_BASE_URL`ni HTTPS API domeniga qo'ying, yoki R2 + CDN.
