# Kuryer Google Maps yo'nalish + Telegram emoji

## 1. Kuryer panelida Google Maps yo'nalish (asosiy)
Kuryer yetkazma detalida (xarita tagida) **"Google Maps orqali yo'nalish"** tugmasi —
bosilganda Google Maps **directions** ochiladi (kuryerning joriy joylashuvidan
manzilga yo'l avtomatik chiziladi).

- `googleMapsDir(lat, lng)` (`courier/src/features/deliveries/status.ts`):
  `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=driving`.
- `deliveries/[id]/page.tsx`: route-map kartasi tagida to'liq enli brand tugma
  (yetkazish manziliga). Header'da kichik "Yandex" muqobil linki ham qoldi.
- Oqim: kuryer "Mahsulotni oldim" → ichki xarita + "Google Maps orqali yo'nalish"
  → Google'da yo'l → yetib boradi → "Yetkazdim".

## 2. Telegram xabarlarida emoji (ilova UI emoji'siz qoladi)
Egasi: telegram xabarlari zerikarli/hunuk edi. Endi `NotificationsService.pushTelegram`
telegram matniga **tur bo'yicha emoji** prefiks qo'shadi (`TG_EMOJI`): INFO 🔔,
SUCCESS ✅, WARNING ⚠️, DANGER ❌, ANNOUNCE 📣.

**Muhim ajrim:** ilova UI (toast/bell/sahifalar) emoji'siz qoladi (Lucide ikon) —
emoji faqat Telegram matnida qo'shiladi (`title`/`body` o'zgarmaydi). Telegram'da
"Buyurtmani ko'rish" tugmasi ham bor (mini-appni ochadi).

## Tekshiruv
- server `tsc` toza · courier `tsc` toza · yangi kod lint-toza (qolgan
  `formatPhoneNumber` unused — pre-existing warning).
