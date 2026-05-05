ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS instrumental_tests jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS differentials jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS chosen_diagnosis text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS family_advice text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'uz'::text;