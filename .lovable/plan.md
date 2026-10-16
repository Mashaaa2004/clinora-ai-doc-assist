## Reja: Klinik protokollarga asoslangan tibbiy hujjat yordamchisi

Mavjud Clinora jarayoni saqlanadi: ovoz yozish, matn, tahlil, PDF, tarix, admin panel va CRM ulanishi buzilmaydi. AI provayderi o'zgartirilmaydi. Hozirgi tahlil Gemini emas, mavjud ishlayotgan model orqali ishlaydi; uni almashtirish kerak bo'lsa, alohida so'rayman.

### 1. Protokollar kutubxonasi (admin)
- Admin PDF yoki matnli protokol yuklaydi.
- Har bir hujjat uchun: rasmiy nomi, mutaxassislik, chiqargan tashkilot, tasdiqlangan yoki qayta ko'rilgan sana, manba havolasi, versiya, holat.
- Holatlar: tekshiruv kutilmoqda, tasdiqlangan, eskirgan.
- Nom, mutaxassislik, kasallik va kalit so'zlar bo'yicha qidiruv.
- Faqat tasdiqlangan va eskirmagan hujjatlar rasmiy manba sifatida ishlatiladi.

### 2. Manbadan parcha topish
- Yuklangan matn sahifa yoki bo'limlarga bo'linib saqlanadi.
- Savol yoki konsultatsiya bo'yicha mos parchalar faqat tasdiqlangan hujjatlardan qidiriladi.
- AI javobida manba nomi, bo'lim, versiya/sana va sahifa yoki parcha ko'rsatiladi.
- Mos manba topilmasa: "tasdiqlangan mos protokol topilmadi" deb aniq aytiladi.
- Qattiq yozilgan soxta javoblar ishlatilmaydi.

### 3. Tibbiy qoralama
- Bemor aytgan shikoyatlar, ko'rik natijalari, laboratoriya natijalari va shifokor bahosi alohida.
- SOAP tuzilmasi: subyektiv, obyektiv, baho, reja.
- Yetishmayotgan, noaniq yoki qarama-qarshi ma'lumotlar alohida belgilanadi.
- Shoshilinch xavf belgilari ko'rsatiladi.
- Tashxis va dori takliflari faqat shifokor ko'rib chiqishi kerak bo'lgan qoralama sifatida ko'rsatiladi.

### 4. Shifokor tasdig'i
- Har bir AI natijasi "Qoralama" deb belgilanadi.
- Shifokor tahrirlaydi, rad etadi yoki aniq "Tasdiqlayman" tugmasi bilan tasdiqlaydi.
- Yakuniy hujjat va tasdiq vaqti faqat shu harakatdan keyin saqlanadi.

### 5. Rasmiy saytlar
- Berilgan ikki rasmiy sahifadan hujjatlarni avtomatik olish mumkinligi tekshiriladi.
- Agar ishonchli olish imkoni bo'lmasa, admin tasdiqlangan PDF yoki matnni qo'lda yuklaydi.
- Protokol nomi yoki tavsiyalar to'qib chiqarilmaydi.

### 6. Maxfiylik
- AI ga bemor ismi va aloqa ma'lumotlari yuborilmaydi; hujjatda ular ilova ichida qo'shiladi.
- Shifokor faqat o'z yoki ruxsat etilgan klinika yozuvlarini ko'radi.
- To'liq suhbat matni va bemor ma'lumotlari keraksiz loglarga yozilmaydi.

### 7. Sinovlar
Sun'iy ma'lumotlar bilan tekshiriladi:
- simptom yoki ko'rik natijasi to'qilmasligi;
- tasdiqlangan manbadan to'g'ri iqtibos;
- manba yo'q bo'lsa aniq ogohlantirish;
- qarama-qarshi yoki to'liq bo'lmagan ma'lumot belgilanishi;
- tasdiq tugmasisiz hujjat yakunlanmasligi;
- mavjud kirish, tahlil va PDF ishlashi.

### Texnik tafsilotlar
- Yangi jadvallar: protokollar, protokol parchalari, hujjat qoralamalari/tasdiq tarixi; tegishli ruxsatlar va qator darajasidagi himoya.
- Fayllar maxfiy saqlash joyida; o'qish faqat admin va ruxsatli shifokorlar uchun.
- Parcha qidiruvi dastlab Postgres matn qidiruvi bilan; keyinchalik semantik qidiruv xizmatiga alohida chegara qoldiriladi.
- Tahlil funksiyasi mos parchalarni server tomonida oladi va natijada manbalarni alohida qaytaradi.
- Sinovlar loyihaning mavjud test tizimiga qo'shiladi.

### Yakunda hisobot
Nima qilingani, nima sinalgani, nima qolgani va tizim haqiqiy yuklangan protokollardan foydalanayaptimi yoki faqat ko'rsatmalar bilan ishlayaptimi — aniq yoziladi.