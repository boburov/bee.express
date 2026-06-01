# Admin login — parolni ko'rsatish (eye) tugmasi

## Maqsad

SuperAdmin login sahifasidagi parol maydoniga "eye" (ko'z) tugmasi qo'shildi.
Foydalanuvchi tugmani bossa, parol matni ochiq/yopiq holatga o'tadi — terilgan
parolni tekshirib olish uchun.

## Qilingan o'zgarish

### `admin/src/features/auth/super-admin-login/LoginForm.tsx`

- `lucide-react` dan `Eye` va `EyeOff` ikonkalari import qilindi.
- Yangi `showPassword` state qo'shildi (default `false`).
- Parol `Input` ning `type` i endi shartli: `showPassword ? "text" : "password"`.
- `Input` ning `rightSlot` iga toggle tugmasi qo'yildi:
  - `type="button"` — formani submit qilmaydi.
  - `onClick` — `showPassword` ni teskari qiladi.
  - `disabled={loading}` — yuklanish paytida bloklangan.
  - `aria-label` (yashirish/ko'rsatish) va `aria-pressed` — skrinrider uchun.
  - Ochiq holatda `EyeOff`, yopiq holatda `Eye`.

`Input` komponentida `rightSlot` allaqachon mavjud edi
([admin/src/shared/ui/Input.tsx](../admin/src/shared/ui/Input.tsx)), shuning
uchun komponentga o'zgartirish kerak bo'lmadi.

## Tekshirish

```bash
npm --prefix admin run lint
npx --prefix admin tsc --noEmit -p admin/tsconfig.json
```

Ikkalasi ham xatosiz o'tdi. Vizual tekshirish: `/login` sahifasini ochib,
parol kiriting va o'ng tomondagi ko'z tugmasini bosing — matn ochiladi/yopiladi.
