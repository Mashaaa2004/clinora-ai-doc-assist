-- Add lab_tests to consultations
ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS lab_tests jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Allow all authenticated doctors to view ALL consultations (shared patient history)
DROP POLICY IF EXISTS "Doctors view own consultations" ON public.consultations;
CREATE POLICY "Authenticated doctors view all consultations"
ON public.consultations
FOR SELECT
TO authenticated
USING (true);

-- Index for fast patient name search across doctors
CREATE INDEX IF NOT EXISTS idx_consultations_patient_name_lower
  ON public.consultations (lower(patient_name));
CREATE INDEX IF NOT EXISTS idx_consultations_created_at
  ON public.consultations (created_at DESC);