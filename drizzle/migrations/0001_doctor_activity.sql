ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS started_at timestamptz, ADD COLUMN IF NOT EXISTS ended_at timestamptz, ADD COLUMN IF NOT EXISTS duration_seconds integer;
CREATE TABLE IF NOT EXISTS public.doctor_activity (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'idle',
  consultation_started_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.doctor_activity TO authenticated;
GRANT ALL ON public.doctor_activity TO service_role;
ALTER TABLE public.doctor_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctor views own activity" ON public.doctor_activity FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Doctor inserts own activity" ON public.doctor_activity FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctor updates own activity" ON public.doctor_activity FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);