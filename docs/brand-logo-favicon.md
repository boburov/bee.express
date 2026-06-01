# Brend logosi va favicon — yagona bee logosi

## Maqsad

Yagona **bee** logosini (manba: `bee_no_bg.png`) to'rt panelning hammasida
ishlatish:

- **Favicon** (brauzer tab ikonkasi) — barcha panellarda.
- **Sidebar / topbar / login** sahifalaridagi brend logosi.

## Manba rasm

Asl logo `1019 × 860` RGBA (shaffof fon), kvadrat emas edi. PIL bilan qayta
ishlandi:

1. Shaffof chekkalar `getbbox()` orqali kesildi (bir xil padding uchun).
2. Bee markazlashtirilib **kvadrat shaffof** canvas'ga joylashtirildi.

Generatsiya qilingan fayllar (har bir panel uchun bir xil):

| Fayl              | O'lcham   | Maqsad                                         |
| ----------------- | --------- | ---------------------------------------------- |
| `logo.png`        | 512×512   | Header/sidebar/login logosi (`<Logo>`)         |
| `app/icon.png`    | 512×512   | Yuqori aniqlikdagi favicon (modern brauzerlar) |
| `app/favicon.ico` | 16/32/48/64 | Klassik favicon (`.ico`)                     |
| `app/apple-icon.png` | 180×180 | iOS "Add to Home Screen" (oq fon)             |

`apple-icon.png` da **oq fon** ishlatildi, chunki iOS shaffof joylarni qora
qiladi.

Manba haqiqat sifatida [assets/logo.png](../assets/logo.png) ham yangilandi
(panellarning `public/logo.png` shu yerdan ko'chiriladi).

## Next.js 16 favicon konvensiyasi

Next.js 16 da `app/` ichidagi `favicon.ico`, `icon.png`, `apple-icon.png`
fayllari avtomatik `<link rel="icon">` teglarini yaratadi
([app-icons.md](../admin/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/app-icons.md)).

Ilgari layout'larda **qo'lda** `metadata.icons = { icon: "/logo.png" }` bor edi.
Bu file-convention bilan **ikkilanib** ketardi (ikkita `<link rel="icon">` —
default Next ikonkasi + logo.png). Endi `metadata.icons` o'chirildi va faqat
file-convention ishlaydi (toza, ortiqcha teg yo'q).

O'zgargan layout'lar:

- [admin/src/app/layout.tsx](../admin/src/app/layout.tsx)
- [client/src/app/layout.tsx](../client/src/app/layout.tsx)
- [seller/src/app/layout.tsx](../seller/src/app/layout.tsx)
- [courier/src/app/layout.tsx](../courier/src/app/layout.tsx)

## Header logosi

`<Logo>` komponenti `<Image src="/logo.png">` orqali `public/logo.png` ni
ko'rsatadi — bu sidebar/topbar/login sahifalarida ishlatiladi:

- admin: [Sidebar.tsx](../admin/src/widgets/sidebar/Sidebar.tsx), login
- seller: [Sidebar.tsx](../seller/src/widgets/sidebar/Sidebar.tsx), login
- client: [Topbar.tsx](../client/src/widgets/topbar/Topbar.tsx), login

`public/logo.png` almashtirilgani uchun bular avtomatik yangilandi.

### Courier — emoji'dan haqiqiy logoga

Courier'ning [Logo.tsx](../courier/src/components/Logo.tsx) ilgari `🐝` emojisini
ko'rsatardi (`bee-500` tokeni globals.css da yo'q edi). Endi boshqa panellar
bilan bir xil `<Image src="/logo.png">` + `Bee<span>Express</span>` wordmark
pattern'iga o'tkazildi (`text-brand-500` tokeni bilan).

## Tekshirish

- `courier`: `npx tsc --noEmit` → toza (yangi `next/image` import).
- Boshqa panellarda faqat metadata o'chirildi + rasm fayllari almashtirildi.
