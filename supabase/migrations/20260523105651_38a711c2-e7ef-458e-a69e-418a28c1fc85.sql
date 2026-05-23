ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS patient_code TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_consultations_patient_code
  ON public.consultations (patient_code);

CREATE INDEX IF NOT EXISTS idx_consultations_user_created
  ON public.consultations (user_id, created_at DESC);