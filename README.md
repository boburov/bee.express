­# BeeExpress - Texnik Topshiriq (TZ)

## 1. Loyiha haqida umumiy ma'lumot

BeeExpress - bu uch tomonlama (3-sided) marketplace va yetkazib berish platformasi. Platforma ovqat, qurilish mollari va boshqa ko'plab­ kategoriyalardagi mahsulotlarni sotib olish va yetkazib berishni bitta tizimga birlashtiradi.

Platforma uchta asosiy ishtirokchi turi bilan ishlaydi:

- **Sotuvchilar** - restoran, do'kon, ombor egalari. Ular o'z mahsulotlarini joylashtiradi va sotadi
- **Xaridorlar** - oddiy foydalanuvchilar. Telegram Mini App orqali buyurtma berishadi
- **Kuryerlar** - mahsulotni sotuvchidan olib, xaridorga yetkazadigan shaxslar

Loyihaning asosiy g'oyasi - har bir kategoriya uchun alohida ilova ochmasdan, bitta platforma orqali hamma narsani buyurtma qila olish va yetkazib berish.

## 2. Biznes modeli

Platforma daromadi ikki manbadan tashkil topadi:

**Sotuvchilardan komissiya** - asosiy daromad manbai. Har bir sotuvdan taxminan 10% komissiya olinadi. Bu foiz kategoriyaga qarab o'zgarishi mumkin (kelajakda).

**Yetkazib berishdan daromad** - qo'shimcha daromad. Yetkazib berish narxidan ma'lum foiz platforma ushlab qoladi, qolgani kuryerga o'tadi.

Boshlang'ich bosqichda platforma faqat bitta tuman (viloyat) doirasida ishlaydi. Keyinchalik boshqa hududlarga kengaytiriladi.

## 3. Asosiy ishtirokchilar va ularning rollari

### 3.1. Super Admin (BeeExpress jamoasi)

Bu platformani boshqaradigan eng yuqori daraja. Web panel orqali ishlaydi.

Vazifalari:
- Yangi sotuvchilarni tasdiqlash (moderatsiya)
- Yangi kategoriyalarni qo'shish va boshqarish
- Komissiya foizlarini belgilash
- Hududlarni (radius, tuman) sozlash
- Statistika va hisobotlarni ko'rish
- Shikoyatlarni ko'rib chiqish
- Foydalanuvchilarni bloklash/tiklash
- Tizim sozlamalarini boshqarish

### 3.2. Sotuvchi (Seller)

Web admin panel orqali ishlaydi. Bitta sotuvchi bir nechta do'kon/filial ocha oladi.

Vazifalari:
- Ro'yxatdan o'tish va hujjatlarni yuklash
- Do'kon/filial yaratish va sozlash
- Mahsulot/taom qo'shish, tahrirlash, o'chirish
- Buyurtmalarni qabul qilish va holatini yangilash
- Mahsulot qoldig'ini boshqarish (stop-list)
- O'z statistikasi va daromadini ko'rish
- Ish vaqtini sozlash

### 3.3. Xaridor (Customer)

Telegram Mini App orqali ishlaydi.

Vazifalari:
- Ro'yxatdan o'tish (telefon raqam orqali)
- Kategoriyalardan mahsulot tanlash
- Buyurtma berish va manzilni ko'rsatish
- To'lov qilish (hozircha naqd)
- Buyurtma holatini kuzatish
- Kuryer va sotuvchi bilan bog'lanish
- Buyurtmani baholash va sharh yozish

### 3.4. Kuryer (Courier)

Telegram Mini App orqali ishlaydi (alohida bo'lim yoki alohida bot).

Kuryer uchta turda bo'ladi:

**O'z kuryerimiz (Shtatdagi)** - BeeExpress nomidan ishlaydigan, doimiy kuryerlar. Ular sizning transportingizdan foydalanishi mumkin. Ularga to'lov sxemasi alohida (oylik + bonus yoki yuqori foiz).

**Sotuvchi kuryeri** - sotuvchining o'z kuryeri. Faqat o'sha sotuvchining buyurtmalarini yetkazadi. Platforma bu kuryerga past komissiya oladi, chunki sotuvchining mas'uliyatida.

**Erkin kuryer (Freelance/Notanish)** - platformaga mustaqil qo'shilgan kuryerlar. Ular istalgan sotuvchining buyurtmasini olishi mumkin. To'lov standart sxema bo'yicha (har buyurtmadan ma'lum foiz).

Vazifalari:
- Ro'yxatdan o'tish (hujjat tekshiruvi bilan)
- O'z radiusi va kategoriyalarni tanlash
- Yaqin buyurtmalarni ko'rish va qabul qilish
- Buyurtmani sotuvchidan olish va xaridorga yetkazish
- Holatlarni yangilash
- O'z daromadini kuzatish

## 4. Platformalar va texnik ko'rinish

- **Super Admin paneli** - Web ilova
- **Sotuvchi paneli** - Web ilova
- **Xaridor ilovasi** - Telegram Mini App
- **Kuryer ilovasi** - Telegram Mini App (alohida bo'lim yoki alohida bot)

## 5. Kategoriyalar tizimi

Tizim dinamik kategoriyalarda ishlaydi. Bu degani Super Admin yangi kategoriya qo'shganda, har bir kategoriya o'z xususiyatlariga ega bo'lishi mumkin.

Boshlang'ich kategoriyalar:
- Ovqat (restoranlar, oshxonalar)
- Qurilish mollari (qum, shag'al, g'isht va h.k.)
- Mevalar va sabzavotlar

Har bir kategoriyaning o'z xususiyatlari:

**Ovqat kategoriyasi uchun:**
- Tayyorlash vaqti
- Issiq/sovuq belgisi
- Ingredientlar ro'yxati
- Modifikatorlar (qo'shimcha pishloq, achchiq sous va h.k.)
- Porsiya hajmi

**Qurilish mollari uchun:**
- O'lchov birligi (kg, tonna, kamaz, dona)
- Og'irlik va hajm
- Yetkazish uchun maxsus transport kerakmi
- Minimal buyurtma hajmi

**Mevalar uchun:**
- O'lchov birligi (kg, quti)
- Mavsumiyligi
- Saqlash sharoiti

Yangi kategoriya qo'shilganda, Super Admin qaysi maydonlar (fieldlar) majburiyligini va qaysilari ixtiyoriy ekanligini sozlay oladi.

## 6. Ro'yxatdan o'tish jarayoni

### 6.1. Xaridor ro'yxatdan o'tishi

1. Telegram Mini App'ga kiradi
2. Telefon raqamini kiritadi (Telegram orqali avtomatik)
3. Ismini kiritadi
4. Manzilini qo'shadi (xarita orqali yoki qo'lda)
5. Tayyor - buyurtma berishi mumkin

### 6.2. Sotuvchi ro'yxatdan o'tishi

1. Web saytga kiradi va "Sotuvchi bo'lish" tugmasini bosadi
2. Asosiy ma'lumotlarni kiritadi:
   - Do'kon/oshxona nomi
   - Egasining ismi
   - Telefon raqami
   - Email
   - Manzil (xarita orqali)
3. Hujjatlarni yuklaydi:
   - STIR (INN)
   - Litsenziya (kategoriyaga qarab - masalan, dorixona uchun)
   - Sanitariya guvohnomasi (oshxona uchun)
4. Kategoriyani tanlaydi
5. Ariza Super Admin'ga moderatsiyaga ketadi
6. Tasdiqlangandan keyin login/parol oladi
7. Do'konini sozlay boshlaydi

### 6.3. Kuryer ro'yxatdan o'tishi

1. Telegram Mini App'ga kiradi
2. "Kuryer bo'lish" tugmasini bosadi
3. Ma'lumotlarini kiritadi:
   - Ism, familiya
   - Telefon raqami
   - Pasport seriyasi va raqami
   - Pasport rasmini yuklaydi
4. Transport ma'lumotlarini kiritadi:
   - Transport turi (piyoda, velosiped, mototsikl, mashina, yuk mashinasi)
   - Texnik passport (agar mashina bo'lsa)
   - Haydovchilik guvohnomasi
5. Qaysi kategoriyalarda ishlashni tanlaydi (masalan, faqat ovqat yoki qurilish ham)
6. O'z ish radiusini belgilaydi (5km, 10km, 15km va h.k.)
7. Ariza Super Admin'ga moderatsiyaga ketadi
8. Tasdiqlangandan keyin ishlay boshlaydi

## 7. Mahsulot boshqaruvi

### 7.1. Sotuvchi mahsulot qo'shganda

Sotuvchi yangi mahsulot qo'shish uchun:

1. Mahsulot nomi
2. Tavsifi
3. Rasm(lar) - majburiy, kamida 1 ta
4. Narxi
5. Kategoriya (avval tanlagan kategoriyasiga qarab)
6. O'lchov birligi (dona, kg, tonna, kamaz va h.k.)
7. Mavjud miqdori (qoldiq)
8. Maxsus xususiyatlar (kategoriyaga qarab - tayyorlash vaqti, ingredientlar va h.k.)
9. Aktiv/Noaktiv holati

Qo'shilgan mahsulot Super Admin moderatsiyasiga tushadi. Tasdiqlangandan keyin xaridorlarga ko'rinadi.

### 7.2. Qoldiq boshqaruvi

Mahsulot qoldig'i ikki usulda boshqariladi:

**Sanaladigan mahsulotlar** (telefon, kiyim, dori) - har buyurtmadan keyin avtomatik -1 bo'ladi. Qoldiq 0 bo'lsa, "Mavjud emas" deb belgilanadi.

**Sanalmaydigan mahsulotlar** (ovqat, qum) - sotuvchi qo'lda "Bor" yoki "Tugadi" deb belgilaydi (stop-list).

Agar mahsulot tugab qolsa va xaridor allaqachon buyurtma bergan bo'lsa, sotuvchi buyurtmani bekor qiladi va xaridorga avtomatik xabar boradi.

## 8. Buyurtma berish jarayoni (Xaridor tomondan)

1. Xaridor Telegram Mini App'ga kiradi
2. Bosh sahifada kategoriyalar ko'rsatiladi
3. Kategoriyani tanlaydi
4. Yaqin atrofdagi sotuvchilar ro'yxati chiqadi (10km radius ichida yoki sotuvchi belgilagan radius doirasida)
5. Agar yaqin atrofda sotuvchi yo'q bo'lsa - **"Sizning hududingizda yetkazib berish mavjud emas"** xabari chiqadi
6. Sotuvchini tanlaydi
7. Mahsulot ro'yxatini ko'radi
8. Mahsulotlarni savatga qo'shadi
9. Yetkazib berish manzilini tasdiqlaydi
10. To'lov usulini tanlaydi (hozircha naqd)
11. Buyurtmani tasdiqlaydi
12. Buyurtma holatini real vaqtda kuzatadi

### 8.1. Bir nechta sotuvchidan buyurtma

Boshlang'ich versiyada xaridor faqat bitta sotuvchidan bir vaqtda buyurtma bera oladi. Bu cheklov chunki turli sotuvchilardan birga olib kelish murakkab.

Kelajakda (V2 yoki V3): agar ikkita sotuvchi bir-biriga yaqin bo'lsa (masalan, 500 metr ichida) va bitta kuryer ikkalasidan ham ola olsa - bu funksiya qo'shiladi.

## 9. Buyurtma hayot sikli (Order Lifecycle)

Har bir buyurtma quyidagi holatlardan o'tadi:

1. **Yangi (New)** - xaridor buyurtma berdi, sotuvchi hali ko'rmagan
2. **Qabul qilindi (Accepted)** - sotuvchi buyurtmani ko'rdi va qabul qildi
3. **Tayyorlanmoqda (Preparing)** - sotuvchi mahsulotni tayyorlamoqda
4. **Tayyor (Ready)** - mahsulot tayyor, kuryer kelishini kutmoqda
5. **Kuryer izlanmoqda (Searching Courier)** - tizim kuryer qidirmoqda
6. **Kuryer topildi (Courier Assigned)** - kuryer buyurtmani qabul qildi
7. **Olib ketildi (Picked Up)** - kuryer mahsulotni sotuvchidan oldi
8. **Yo'lda (On the Way)** - kuryer xaridor tomon ketmoqda
9. **Yetkazildi (Delivered)** - mahsulot xaridorga topshirildi
10. **Yakunlandi (Completed)** - to'lov o'tdi, hamma narsa joyida
11. **Bekor qilindi (Cancelled)** - buyurtma bekor qilindi

Har bir holat o'zgarishida:
- Vaqt qayd etiladi
- Kim o'zgartirgani saqlanadi
- Xaridor, sotuvchi va kuryerga bildirishnoma boradi

## 10. Buyurtmani bekor qilish

Buyurtmani bekor qilish quyidagi qoidalar asosida bo'ladi:

**Xaridor bekor qila oladi:**
- Sotuvchi qabul qilmaguniga qadar - bemalol
- Sotuvchi qabul qilgandan keyin - faqat sabab bilan
- Sotuvchi tayyorlashni boshlagandan keyin - bekor qilib bo'lmaydi (yoki to'lov qaytmaydi)

**Sotuvchi bekor qila oladi:**
- Mahsulot tugab qolsa
- Kutilmagan vaziyatda (sabab kerak)
- Tez-tez bekor qilsa - reytingi tushadi va platformadan chiqarib yuborilishi mumkin

**Kuryer bekor qila oladi:**
- Buyurtmani qabul qilgandan keyin texnik sabab bilan
- Tez-tez bekor qilsa - reytingi tushadi va jarima

Bekor qilingan buyurtmaning sababi va kimga aybdor ekanligi qayd etiladi.

## 11. Kuryer ishi qanday ishlaydi

### 11.1. Kuryer buyurtmani ko'rishi

Kuryer Telegram Mini App'da quyidagilarni ko'radi:

- O'z atrofidagi (radius ichidagi) yangi buyurtmalar ro'yxati
- Har bir buyurtma uchun: olish manzili, yetkazish manzili, masofa, taxminiy daromad
- Buyurtma turi (ovqat, qurilish va h.k.)
- Mahsulot og'irligi/hajmi

**Muhim:** kuryer faqat bo'sh (hali olinmagan) buyurtmalarni ko'radi. Boshqa kuryer olgan buyurtmalar ko'rinmaydi.

### 11.2. Buyurtmani qabul qilish

1. Kuryer buyurtmani ko'radi va "Qabul qilaman" tugmasini bosadi
2. Buyurtma uning nomiga belgilanadi
3. Sotuvchi manzili va telefon raqami ko'rinadi
4. Kuryer sotuvchiga boradi
5. Mahsulotni oladi va "Oldim" deb belgilaydi
6. Endi xaridor manzili va telefon raqami ko'rinadi
7. Yetkazadi va "Yetkazdim" deb belgilaydi
8. Xaridordan pulni oladi (naqd)
9. Buyurtma yakunlanadi

### 11.3. Bir vaqtda nechta buyurtma

Bir kuryer bir vaqtda bir nechta buyurtma olib yura oladi, lekin **faqat bitta hudud chegarasida** bo'lsa. Bu degani:

- Agar 3 ta buyurtma bir-biriga yaqin (masalan, 2km radius ichida) bo'lsa - bitta kuryer hammasini olishi mumkin
- Agar buyurtmalar uzoq bo'lsa - faqat bittasini olishi kerak

Tizim bu chegarani avtomatik tekshiradi.

### 11.4. Kuryer turi va to'lov

To'lov sxemasi kuryer turiga qarab har xil:

**O'z kuryerimiz** - oylik maosh + har buyurtmadan kichik bonus. Sizning transportingizdan foydalanadi.

**Sotuvchi kuryeri** - faqat o'z sotuvchisining buyurtmalarini oladi. Platforma kichik komissiya oladi (masalan, har buyurtmadan 1000-2000 so'm).

**Erkin kuryer (Freelance)** - har buyurtmadan ma'lum foiz oladi (masalan, yetkazib berish narxining 70-80%i kuryerga, qolgani platformaga).

## 12. Yetkazib berish narxi

Yetkazib berish narxi avtomatik hisoblanadi va u quyidagilarga bog'liq:

**Asosiy faktor - masofa:** sotuvchidan xaridorgacha bo'lgan km.

**Kategoriya:** ovqat va qurilish mollari uchun narx alohida hisoblanadi.

Ovqat uchun:
- Asosiy narx + (km × narx_per_km)
- Masalan: 5000 so'm + (km × 2000 so'm)

Qurilish mollari uchun:
- Og'irlik va hajm hisobga olinadi
- Maxsus transport kerak bo'lsa qimmatroq
- Masalan: 20000 so'm + (km × 5000 so'm) + (tonna × 10000 so'm)

Yetkazib berish narxini Super Admin sozlaydi va o'zgartiradi.

## 13. Hududiy cheklovlar (Geofencing)

**Sotuvchi tomondan:**
- Har bir sotuvchi o'zining yetkazib berish radiusini belgilaydi (masalan, 5km, 10km, 15km)
- Faqat shu radius ichidagi xaridorlar uning mahsulotini ko'radi

**Xaridor tomondan:**
- Xaridor kirganda, uning lokatsiyasi aniqlanadi
- Faqat unga yetkazib bera oladigan sotuvchilar ko'rsatiladi
- Agar hech kim yetkazmasa - "Sizning hududingizda yetkazib berish mavjud emas" xabari chiqadi

**Kuryer tomondan:**
- Kuryer o'z ish radiusini belgilaydi
- Faqat shu radius ichidagi buyurtmalarni ko'radi

## 14. To'lov tizimi

Boshlang'ich versiyada faqat **naqd to'lov** ishlaydi.

Jarayon:
1. Xaridor buyurtma beradi
2. Mahsulot yetkazib berilganda kuryerga naqd pul beradi
3. Kuryer pulni oladi va tizimda "Pul olindi" deb belgilaydi
4. Kunlik/haftalik hisobotda:
   - Kuryer platformaga komissiyani topshiradi
   - Sotuvchi o'z mahsulotining narxini oladi (kuryerdan yoki platformadan)
   - Platforma o'z komissiyasini ushlab qoladi

Kelajakda qo'shiladi: Click, Payme, plastik karta, ichki hamyon.

## 15. Bildirishnomalar tizimi

Telegram orqali avtomatik xabarlar boradi:

**Xaridor uchun:**
- Buyurtma qabul qilindi
- Tayyorlanmoqda
- Kuryer topildi
- Kuryer mahsulotni oldi
- Kuryer yo'lda (taxminiy yetib kelish vaqti)
- Yetkazildi

**Sotuvchi uchun:**
- Yangi buyurtma keldi
- Kuryer mahsulotni olishga keldi
- Buyurtma yakunlandi

**Kuryer uchun:**
- Yaqin atrofda yangi buyurtma bor
- Buyurtma holati o'zgardi
- Kunlik daromad hisoboti

## 16. Aloqa tizimi

Boshlang'ich versiyada xaridor, sotuvchi va kuryer bir-biri bilan **telefon raqami orqali** bog'lanadi. Ya'ni:

- Sotuvchi buyurtmani ko'rganda xaridor telefon raqamini ko'radi
- Kuryer buyurtmani qabul qilganda sotuvchi va xaridor raqamlarini ko'radi
- Xaridor o'z buyurtmasini ko'rganda kuryer raqamini ko'radi

Kelajakda ichki chat yoki masked call (yashirilgan raqam) qo'shilishi mumkin.

## 17. Reyting va sharhlar tizimi

### 17.1. Sotuvchi reytingi

- Xaridor buyurtmadan keyin sotuvchini 1-5 yulduz bilan baholaydi
- Sharh yozishi mumkin (ixtiyoriy)
- Sotuvchining umumiy reytingi profili'da ko'rsatiladi
- 3 yulduzdan past reyting bo'lsa - ogohlantirish
- 2 yulduzdan past bir necha marta bo'lsa - tekshiruv

### 17.2. Kuryer reytingi

- Xaridor kuryerni 1-5 yulduz bilan baholaydi
- Sotuvchi ham kuryerni baholay oladi (mahsulotni olishda qanday muomala qildi)
- Past reyting kuryerga kam buyurtma keladi
- Juda past bo'lsa - platformadan chiqariladi

### 17.3. Xaridor reytingi (kelajakda)

Kuryer va sotuvchi xaridorni ham baholashi mumkin. Bu tez-tez bekor qiluvchi yoki muammoli mijozlarni aniqlash uchun.

## 18. Super Admin paneli funksiyalari

### 18.1. Dashboard (bosh sahifa)
- Bugungi buyurtmalar soni
- Bugungi tushum
- Aktiv kuryerlar soni
- Aktiv sotuvchilar soni
- Yangi ro'yxatdan o'tganlar
- Shikoyatlar soni

### 18.2. Sotuvchilar bo'limi
- Barcha sotuvchilar ro'yxati
- Yangi arizalarni ko'rib chiqish va tasdiqlash/rad etish
- Sotuvchi profilini ko'rish va tahrirlash
- Bloklash/tiklash
- Komissiya foizini sozlash
- Sotuvchi statistikasi

### 18.3. Kuryerlar bo'limi
- Barcha kuryerlar ro'yxati
- Yangi arizalarni ko'rib chiqish va tasdiqlash/rad etish
- Kuryer turini belgilash (o'zimizniki, sotuvchi, erkin)
- Kuryer profilini ko'rish va tahrirlash
- Bloklash/tiklash
- Kuryer statistikasi (qancha buyurtma, daromad, reyting)

### 18.4. Xaridorlar bo'limi
- Barcha xaridorlar ro'yxati
- Profilni ko'rish
- Bloklash (agar ko'p buyurtma bekor qilsa yoki muammo bo'lsa)
- Buyurtmalar tarixi

### 18.5. Kategoriyalar bo'limi
- Yangi kategoriya qo'shish
- Har bir kategoriya uchun fieldlar belgilash
- Komissiya foizini sozlash
- Yetkazib berish narxi formulasini sozlash
- Kategoriyani aktiv/noaktiv qilish

### 18.6. Buyurtmalar bo'limi
- Barcha buyurtmalar ro'yxati
- Filtrlar (sana, holat, sotuvchi, kuryer, hudud)
- Buyurtma tafsilotlarini ko'rish
- Muammoli buyurtmalarga aralashish (masalan, kuryer topilmagan)

### 18.7. Moliyaviy bo'lim
- Kunlik/oylik tushum
- Sotuvchilarga to'lovlar
- Kuryerlarga to'lovlar
- Platforma sof daromadi
- Hisobotlar (Excel'ga eksport)

### 18.8. Hududlar bo'limi
- Tumanlar va shaharlarni boshqarish
- Yangi hudud qo'shish (kelajakda kengayganda)
- Hudud bo'yicha statistika

### 18.9. Shikoyatlar bo'limi (kelajakda to'liq, hozir oddiy)
- Foydalanuvchilardan kelgan shikoyatlar
- Holat o'zgartirish (yangi, ko'rib chiqilmoqda, hal qilindi)

### 18.10. Sozlamalar
- Tizim umumiy sozlamalari
- Komissiya foizlarining default qiymatlari
- Bildirishnoma sozlamalari
- Admin foydalanuvchilarni boshqarish

## 19. Sotuvchi paneli funksiyalari

### 19.1. Dashboard
- Bugungi buyurtmalar
- Bugungi tushum
- Yangi buyurtmalar bildirishnomasi
- Eng ko'p sotilgan mahsulotlar

### 19.2. Mahsulotlar
- Mahsulotlar ro'yxati
- Yangi mahsulot qo'shish
- Tahrirlash, o'chirish
- Stop-list (vaqtinchalik mavjud emas)
- Qoldiqlarni yangilash

### 19.3. Buyurtmalar
- Yangi buyurtmalar (qabul qilish kerak)
- Tayyorlanmoqda
- Tayyor (kuryer kutilmoqda)
- Yetkazilmoqda
- Yakunlangan
- Bekor qilingan

### 19.4. Filiallar (agar bir nechta bo'lsa)
- Filiallar ro'yxati
- Yangi filial qo'shish
- Har bir filial uchun alohida menyu/mahsulotlar
- Filial sozlamalari

### 19.5. Statistika
- Kunlik/haftalik/oylik tushum
- Eng ko'p sotilgan mahsulotlar
- Eng ko'p buyurtma keladigan vaqtlar
- Xaridorlar geografiyasi

### 19.6. Moliyaviy
- Sof daromad
- Platforma komissiyasi
- To'lovlar tarixi

### 19.7. Sozlamalar
- Do'kon profili
- Ish vaqti
- Yetkazib berish radiusi
- Bank rekvizitlari (kelajakda to'lov uchun)

## 20. Xaridor (Telegram Mini App) funksiyalari

### 20.1. Bosh sahifa
- Kategoriyalar ro'yxati
- Mashhur sotuvchilar
- Aksiyalar va chegirmalar (kelajakda)
- Qidiruv

### 20.2. Kategoriya sahifasi
- Yaqin atrofdagi sotuvchilar
- Filtrlar (masofa, reyting, narx)
- Saralash (eng yaqin, eng arzon, eng yuqori reyting)

### 20.3. Sotuvchi sahifasi
- Sotuvchi haqida ma'lumot
- Reyting va sharhlar
- Mahsulotlar ro'yxati
- Ish vaqti
- Yetkazib berish narxi va vaqti

### 20.4. Savat
- Tanlangan mahsulotlar
- Miqdorni o'zgartirish
- Umumiy summa
- Yetkazib berish narxi
- Manzil

### 20.5. Buyurtma berish
- Manzilni tasdiqlash
- Izoh qoldirish (masalan, "eshikni qattiq taqillating")
- To'lov usulini tanlash
- Buyurtmani tasdiqlash

### 20.6. Mening buyurtmalarim
- Joriy buyurtmalar (holatini kuzatish)
- Buyurtmalar tarixi
- Qayta buyurtma berish

### 20.7. Profil
- Shaxsiy ma'lumotlar
- Manzillar (bir nechta saqlash mumkin)
- Sozlamalar
- Yordam

## 21. Kuryer (Telegram Mini App) funksiyalari

### 21.1. Bosh sahifa
- Ish holati (Aktiv/Noaktiv tugmasi)
- Bugungi daromad
- Bugungi buyurtmalar soni
- Joriy buyurtma (agar bor bo'lsa)

### 21.2. Buyurtmalar xaritasi
- Atrofdagi yangi buyurtmalar xaritada ko'rsatiladi
- Har bir buyurtma uchun: masofa, daromad, mahsulot turi
- "Qabul qilish" tugmasi

### 21.3. Joriy buyurtma
- Sotuvchi manzili va telefon raqami
- Xaridor manzili va telefon raqami
- "Mahsulotni oldim" tugmasi
- "Yetkazdim" tugmasi
- Navigatsiya (xarita ilovasiga o'tish)

### 21.4. Tarix
- Yakunlangan buyurtmalar
- Har biri uchun: sana, summa, masofa, daromad

### 21.5. Daromad
- Kunlik/haftalik/oylik daromad
- Platforma komissiyasi
- Sof daromad
- To'lovlar grafigi

### 21.6. Profil
- Shaxsiy ma'lumotlar
- Transport ma'lumotlari
- Ish radiusi (o'zgartirish mumkin)
- Ishlaydigan kategoriyalar
- Reyting

## 22. Ma'lumotlar bazasi - asosiy ob'ektlar

Quyidagi asosiy ma'lumotlar saqlanadi:

**Foydalanuvchilar:**
- Xaridorlar
- Sotuvchilar (do'kon egalari)
- Kuryerlar
- Adminlar

**Biznes ob'ektlar:**
- Do'konlar/Filiallar
- Kategoriyalar
- Mahsulotlar
- Buyurtmalar
- Buyurtma elementlari (har bir mahsulot alohida)

**Moliyaviy:**
- To'lovlar
- Komissiyalar
- Kuryer daromadlari
- Sotuvchi daromadlari

**Qo'shimcha:**
- Manzillar
- Reytinglar va sharhlar
- Bildirishnomalar
- Shikoyatlar
- Audit log (kim qachon nimani o'zgartirgani)

## 23. Integratsiyalar

Tizim quyidagi tashqi xizmatlar bilan ishlaydi:

**Majburiy (boshlang'ich versiyada):**
- Telegram Bot API - Mini App va bildirishnomalar uchun
- Xarita servisi (Yandex Maps yoki Google Maps) - manzillar va masofa hisoblash uchun
- SMS servisi - foydalanuvchi tasdiqlashlari uchun (agar Telegram'siz kirish bo'lsa)

**Kelajakda:**
- Click, Payme, Apelsin - to'lov tizimlari
- Plastik karta to'lovlari (UzCard, Humo, Visa)
- 1C yoki boshqa buxgalteriya tizimlari (sotuvchilar uchun)

## 24. Xavfsizlik talablari

- Barcha parollar shifrlangan holda saqlanadi
- Hujjatlar (pasport, litsenziya) himoyalangan serverda
- Har bir muhim amal log'ga yoziladi (kim, qachon, nima qildi)
- Admin paneliga kirish IP whitelist orqali cheklanishi mumkin
- 2FA (ikki bosqichli autentifikatsiya) adminlar uchun
- Foydalanuvchi ma'lumotlari uchinchi shaxslarga berilmaydi

## 25. MVP (Birinchi versiya) tarkibi

Sizning aytishingizcha **hamma narsa majburiy**, lekin men tavsiya beraman boshlang'ich versiyada quyidagilar bo'lsin:

**MVP'ga kiradi:**
- 1 ta tuman uchun ishlash
- Ovqat kategoriyasi (qurilish keyinroq)
- Telegram Mini App (xaridor uchun)
- Telegram Mini App (kuryer uchun)
- Web admin panel (sotuvchi uchun)
- Web admin panel (Super Admin uchun)
- Naqd to'lov
- Asosiy buyurtma jarayoni
- Geolokatsiya va radius cheklovlari
- Reyting tizimi
- Bildirishnomalar
- Telefon orqali aloqa

**Keyingi versiyalarga qoldiriladi:**
- Boshqa kategoriyalar (qurilish, mevalar va h.k.)
- Bir nechta sotuvchidan buyurtma
- Click/Payme/karta to'lovlari
- Ichki chat
- Masked call
- Aksiya va chegirmalar
- Loyalty dasturi
- Boshqa shaharlar va viloyatlar

## 26. Kelajakdagi versiyalar uchun rejalar

**V2 (3-6 oydan keyin):**
- Qurilish mollari kategoriyasi
- Click va Payme to'lovlari
- Aksiya va promokodlar
- Ichki chat tizimi

**V3 (6-12 oydan keyin):**
- Bir nechta sotuvchidan buyurtma
- Boshqa tumanlar va shaharlar
- Loyalty dasturi (bonuslar)
- Call-center va support tizimi
- Mobile native ilova (agar Telegram cheklovlari bo'lsa)

**V4 va undan keyin:**
- Boshqa viloyatlar va butun O'zbekiston
- Maxsus xizmatlar (dorixona, gulchilar va h.k.)
- B2B mijozlar uchun maxsus shartlar
- Franchayzing tizimi

## 27. Asosiy risklar va ularni hal qilish

**Risk 1: Kuryer yetishmasligi**
Yechim: Sotuvchilarga o'z kuryerini ishlatishga ruxsat berish + erkin kuryerlarni jalb qilish + bonus tizimi.

**Risk 2: Naqd to'lovda muammolar (kuryer pulni o'g'irlashi)**
Yechim: Kuryer reytingi va depozit tizimi + kelajakda elektron to'lovga o'tish.

**Risk 3: Sotuvchi sifati past mahsulot berishi**
Yechim: Reyting tizimi + xaridor sharhlari + past reytingli sotuvchilarni bloklash.

**Risk 4: Tizim yuklamani ko'tara olmasligi (peak vaqtlarda)**
Yechim: Scalable arxitektura + load testing + monitoring.

**Risk 5: Boshqa platformalardan raqobat (Yandex Eats va h.k.)**
Yechim: Mahalliy xususiyatlarga moslashish + arzonroq komissiya + ko'proq kategoriyalar.

## 28. Loyihaning muvaffaqiyat ko'rsatkichlari

Loyiha muvaffaqiyatli ekanligini quyidagi ko'rsatkichlar bilan o'lchash mumkin:

- Kunlik aktiv foydalanuvchilar soni (DAU)
- Kunlik buyurtmalar soni
- O'rtacha buyurtma summasi
- Qayta buyurtma beradigan xaridorlar foizi (retention)
- O'rtacha yetkazib berish vaqti
- Sotuvchi va kuryerlarning o'rtacha reytingi
- Bekor qilingan buyurtmalar foizi (5% dan past bo'lishi kerak)
- Platforma oylik tushumi

---

## Yakuniy eslatma

Bu TZ - loyihaning boshlang'ich versiyasi. Ishlab chiqish jarayonida ba'zi narsalar o'zgarishi va aniqlashtirilishi mumkin. Har bir bo'lim bo'yicha qo'shimcha savollar paydo bo'lsa, ular alohida muhokama qilinadi.

TZ ning keyingi qadami - har bir modul uchun batafsilroq texnik spetsifikatsiya yozish (API endpointlar, ma'lumotlar bazasi sxemasi, UI/UX dizayn). Bu ishlab chiquvchilar bilan birga qilinadi.
