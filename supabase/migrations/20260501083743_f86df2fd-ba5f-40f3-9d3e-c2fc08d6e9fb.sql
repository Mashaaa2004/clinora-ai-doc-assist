CREATE TABLE public.consultations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  patient_name text NOT NULL DEFAULT '',
  transcript text NOT NULL DEFAULT '',
  symptoms jsonb NOT NULL DEFAULT '[]'::jsonb,
  diagnosis text NOT NULL DEFAULT '',
  recommendation text NOT NULL DEFAULT '',
  prescriptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own consultations"
  ON public.consultations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors insert own consultations"
  ON public.consultations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors update own consultations"
  ON public.consultations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors delete own consultations"
  ON public.consultations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_consultations_user_created ON public.consultations (user_id, created_at DESC);

CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();