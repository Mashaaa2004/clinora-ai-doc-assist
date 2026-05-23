ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS doctor_instagram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS doctor_telegram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS clinic_instagram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS clinic_telegram text NOT NULL DEFAULT '';