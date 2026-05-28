
## Reja: Patient User System

### 1. Ma'lumotlar bazasi (migratsiya)

**Yangi enum qiymati:**
- `app_role` ga `patient` qo'shish (mavjud: `admin`, `doctor`)

**Yangi jadval: `clinics`**
- `id`, `name`, `address`, `phone`, `languages_supported text[]`, `is_active`, `created_at`
- RLS: hamma authenticated o'qiy oladi; faqat admin yozadi
- Admin panel uchun CRUD

**Yangi jadval: `patient_profiles`**
- `user_id` (unique), `full_name`, `phone`, `date_of_birth`, `gender`, `language`, `blood_type`, `allergies text[]`, `chronic_conditions text[]`
- RLS: bemor o'zinikini ko'radi/tahrirlaydi; tayinlangan shifokor + admin o'qiy oladi

**`profiles` jadvaliga:**
- `clinic_id uuid` qo'shish (shifokor qaysi klinikaga tegishli) — admin tayinlaydi
- Mavjud shifokorlar `null` qoladi, admin keyin biriktiradi

**Yangi jadval: `symptom_reports`**
- `id`, `patient_id`, `clinic_id`, `assigned_doctor_id` (nullable), `symptoms text`, `language`, `ai_summary`, `ai_urgency` (low/medium/high/emergency), `recommended_specialization`, `status` (pending/assigned/in_review/closed), `created_at`
- RLS: bemor o'zinikini; klinikadagi shifokor (clinic_id mos) + admin ko'radi

**Trigger yangilash:**
- `handle_new_user_role()` — agar `raw_user_meta_data->>'role' = 'patient'` bo'lsa `patient` rolini bersin, aks holda hozirgi mantiq (doctor/admin)

**handle_new_user uchun:**
- Patient bo'lsa `profiles` o'rniga `patient_profiles` ga insert qilsin (metadata asosida)

### 2. Telefon/OTP Auth (Twilio)

- Supabase Auth `Phone` provayderini Twilio bilan yoqish KERAK — bu Lovable Cloud UI orqali qilinmaydi
- Foydalanuvchidan Twilio Account SID, Auth Token, Messaging Service SID kerak — **men sizga Cloud sozlamalaridan qanday yoqishni yo'riqnoma qilib beraman**
- Kodda `supabase.auth.signInWithOtp({ phone })` va `verifyOtp({ phone, token, type: 'sms' })` ishlatamiz

### 3. Auth sahifa qayta dizayni

`src/pages/Auth.tsx`:
- Sarlavha: "Clinora Platform Login"
- Yuqorida 3 ta tab/segment: **Bemorman / Shifokorman / Adminman**
- Patient tab → telefon + OTP flow (2 qadam: telefon → SMS kod → ro'yxatdan o'tish bo'lsa qo'shimcha forma)
- Doctor/Admin tab → mavjud email/parol + Google (hech narsa o'zgarmaydi)
- Patient signup forması: F.I.Sh, telefon, tug'ilgan sana, jins, til (chronic/allergy/blood ixtiyoriy — keyin profil sahifasida ham)

### 4. Role-based routing

`src/hooks/useAuth.tsx`:
- `role: 'admin' | 'doctor' | 'patient' | null` qo'shish (mavjud `isAdmin` saqlanadi)
- `App.tsx` da yangi `/patient` route + `PatientProtectedRoute`
- `Index`/login keyingi redirekt: admin→`/admin`, doctor→`/app`, patient→`/patient`

### 5. Patient Dashboard

`src/pages/patient/PatientDashboard.tsx` (mobile-first):
- Sekciyalar: Yangi tibbiy so'rov • Mening so'rovlarim • Profil • Bildirishnomalar (placeholder)
- Sof kartochka dizayn, mavjud design tokenlar (`--gradient-primary`, `--gradient-soft`)

`src/pages/patient/NewRequest.tsx` (sehrgar):
1. Klinika tanlash (kartochka grid)
2. Simptomlarni yozish (matn + til tanlovi, oldindan tanlangan)
3. Yuborish → edge function `patient-route`
4. Natija ekrani: AI xulosasi, shoshilinchlik, tayinlangan shifokor

`src/pages/patient/MyRequests.tsx`:
- O'z `symptom_reports` ro'yxati, status va shifokor bilan

### 6. AI Routing edge function

`supabase/functions/patient-route/index.ts`:
- JWT tekshir, bemor ekanini tasdiqla
- Body: `{ clinic_id, symptoms, language }`
- Lovable AI (`google/gemini-2.5-flash`) orqali strukturali output: `{ summary, urgency, specialization }`
- `profiles` dan `clinic_id = X` va `specialty ILIKE %recommended%` shifokorlarni tanla
- Birinchi mavjud shifokorni `assigned_doctor_id` qilib tayinla (mos topilmasa klinikadagi har qanday doktor)
- `symptom_reports` ga insert
- Bemorga natija qaytar

`supabase/config.toml` ga `[functions.patient-route] verify_jwt = true`

### 7. Shifokor tomonida (minimal)

Bu iteratsiyada to'liq queue UI emas, lekin mavjud `AppPage` yoki `History` ga kichik "Bemor so'rovlari" badge/link qo'shamiz — to'liq queue keyingi iteratsiyada (siz aytgancha).

### 8. Admin tomonida

`AdminDashboard.tsx` ga **Klinikalar** tabi:
- Klinika qo'shish/tahrirlash/o'chirish
- Shifokorlarni klinikaga biriktirish (profiles.clinic_id update)

### 9. i18n

`src/i18n/translations.ts` ga yangi kalitlar (uz/ru/en — mavjud tillarga mos): `patient.*`, `auth.patient`, `auth.doctor`, `auth.admin`, `clinic.*` va h.k.

### Bajarish tartibi

1. Migratsiya (clinics, patient_profiles, symptom_reports, profiles.clinic_id, app_role enum, triggers, GRANTs, RLS) — tasdiqlashingiz uchun
2. Twilio yo'riqnomasi (siz Cloud da yoqasiz)
3. Auth.tsx qayta yozish + role tabs
4. useAuth + ProtectedRoutes
5. Patient sahifalar (Dashboard, NewRequest, MyRequests)
6. `patient-route` edge function
7. Admin → Klinikalar tabi
8. i18n + nav linklar

### ⚠️ Sizdan kerak

- **Twilio hisob ma'lumotlari** (Account SID, Auth Token, Messaging Service SID yoki yuboruvchi raqam) — Cloud → Users → Auth Settings → Phone provayderiga kiritasiz. Men kodni tayyorlayman, lekin provayderni yoqishni o'zingiz qilasiz (Lovable bu konfiguratsiyani avtomatlashtirmaydi).
- Migratsiyani tasdiqlaysiz.

Tasdiqlasangiz, 1-qadamdan boshlayman.
