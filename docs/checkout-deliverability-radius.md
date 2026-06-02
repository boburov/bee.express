# Checkout — yetkazib berish preview + radius (TZ §13)

## Talab

Xaridor buyurtmani **rasmiylashtira olishi** kerak, va radius bo'yicha: agar
manzil oshxona (do'kon) xizmat radiusida bo'lsa — yetkazilsin (narx ko'rsatilsin);
bo'lmasa — aniq **"bu manzilga yetkazib bera olmaymiz"** desin. (Avval buyurtma
faqat "Tasdiqlash"dan keyin, backend xatosi sifatida rad etilardi — tushunarsiz.)

## Yechim

### Backend — `POST /orders/quote`
`OrdersService.quote(addressId, userId)` — joriy savatni tanlangan manzilga
nisbatan baholaydi, **hech narsa yaratmaydi**. Checkout'ning masofa/radius/narx
mantig'ini aynan takrorlaydi. Har bir do'kon uchun qaytaradi:
`{ deliverable, reason, distanceKm, radiusKm, deliveryFee, subtotal }`, hamda
umumiy `{ deliverable, subtotal, deliveryTotal, total }`.

### Radius izchilligi
FOOD radius gate endi hamma joyda bir xil — `effectiveFoodRadiusKm(store, category)`
(store override → category default → **10km fallback**):
- browse (product/nearby) — avval ham shunday edi,
- **quote** — yangi,
- **checkout** — yangilandi (avval gate o'rnatilmagan bo'lsa yo'q edi; endi 10km default).

Shunday qilib preview va checkout bir xil javob beradi. Xato xabari ham yangilandi:
*"Bu manzilga yetkazib bera olmaymiz — X km radiusda ishlaydi (siz Y km uzoqdasiz)."*

### Frontend — checkout sahifasi
- Manzil tanlanganda (yoki savat o'zgarganda) `ordersApi.quote()` chaqiriladi.
- Har bir do'kon kartasida: **"Yetkazib berish: N so'm · X km"** yoki yetkazilmasa
  qizil **sabab** ko'rsatiladi.
- Pastdagi yakun: Mahsulotlar + Yetkazib berish + **Jami** (real raqamlar; avval
  "keyin qo'shiladi" deb turardi).
- Agar biror do'kon yetkazib bo'lmaydigan bo'lsa — yuqorida banner + **"Tasdiqlash"
  bloklanadi**. (Quote yuklanmasa/xato bo'lsa — submit ochiq qoladi, backend baribir
  tekshiradi.)

## "Buyurtmalar ko'rinmayapti" haqida
Orders ro'yxati sahifasi (`/orders`) to'g'ri — `data.data` ni o'qiydi. Ko'rinmasligi
sababi: buyurtma **muvaffaqiyatli berilmagan** edi (radius/oqim noaniq edi). Endi
oqim aniq: manzil → radius preview → yetkaziladigan bo'lsa Tasdiqlash → buyurtma
yaratiladi → `/orders` da ko'rinadi (har 15s polling bilan yangilanadi).

## Yangi/o'zgargan fayllar
- `server/src/orders/orders.service.ts` — `quote()` + checkout radius izchilligi
- `server/src/orders/orders.controller.ts` — `POST /orders/quote`
- `server/src/orders/dto/order-quote.dto.ts` (yangi)
- `client/src/features/orders/{api,types}.ts` — `quote` + `OrderQuote`
- `client/src/app/(panel)/checkout/page.tsx` — preview UX

## Tekshiruv
- Server `tsc` toza. Client `tsc` toza. Yangi kod lint — qolgan
  `set-state-in-effect` flag pre-existing repo patterni (mavjud manzil-effekti
  bilan bir xil).
