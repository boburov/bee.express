# Kuryer Google Maps yo'nalish + Telegram emoji

## 1. Kuryer panelida Google Maps yo'nalish (asosiy)
Kuryer yetkazma detalida (xarita tagida) **"Google Maps orqali yo'nalish"** tugmasi —
bosilganda Google Maps **directions** ochiladi (kuryerning joriy joylashuvidan
manzilga yo'l avtomatik chiziladi).

- `googleMapsDir(destLat, destLng, origin?)` (`courier/src/features/deliveries/status.ts`):
  **path format** `https://www.google.com/maps/dir/<kuryer_lat,lng>/<manzil_lat,lng>` —
  Google mashrutni darhol chizadi. Origin yo'q bo'lsa `/dir//<manzil>` (qurilma joylashuvi).
  **Pulli Google Directions API kerak emas.** Sessiya tokenlari (`data=`/`g_ep=`/`entry=`)
  ataylab qo'shilmaydi — ular eskirib, hardcode qilingan link buziladi.
  Xaridor manzilini checkout'da **xarita orqali** (F3 LocationPicker) belgilaydi → o'sha
  koordinata destination bo'ladi.
- **Mashrut avtomatik chizilishi uchun** kuryerning joriy GPS joylashuvi (`useGeolocation`)
  `origin` sifatida qo'shiladi — Google darhol origin→destination yo'lni ko'rsatadi
  (origin'siz desktopda/GPS o'chiq bo'lsa yo'l chizilmasligi mumkin edi). Ruxsat berilmagan
  bo'lsa tugma ostida eslatma + qayta so'rash.
- `deliveries/[id]/page.tsx`: route-map kartasi tagida to'liq enli brand tugma. Header'da
  kichik "Yandex" muqobil linki ham qoldi.
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
