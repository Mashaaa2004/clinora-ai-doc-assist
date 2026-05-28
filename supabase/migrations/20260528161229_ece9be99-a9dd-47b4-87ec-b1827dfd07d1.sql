
-- ============ CLINICS ============
CREATE TABLE public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  languages_supported text[] NOT NULL DEFAULT ARRAY['uz','ru','en']::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clinics TO authenticated;
GRANT ALL ON public.clinics TO service_role;

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in views clinics"
  ON public.clinics FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins insert clinics"
  ON public.clinics FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update clinics"
  ON public.clinics FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete clinics"
  ON public.clinics FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROFILES: add clinic_id ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON public.profiles(clinic_id);

-- ============ PATIENT PROFILES ============
CREATE TABLE public.patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  date_of_birth date,
  gender text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'uz',
  blood_type text NOT NULL DEFAULT '',
  allergies text[] NOT NULL DEFAULT '{}',
  chronic_conditions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_profiles TO authenticated;
GRANT ALL ON public.patient_profiles TO service_role;

ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own profile or admin views all"
  ON public.patient_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Patients insert own profile"
  ON public.patient_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients update own profile"
  ON public.patient_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins delete patient profile"
  ON public.patient_profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER patient_profiles_updated_at
  BEFORE UPDATE ON public.patient_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SYMPTOM REPORTS ============
CREATE TABLE public.symptom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  assigned_doctor_id uuid,
  symptoms text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'uz',
  ai_summary text NOT NULL DEFAULT '',
  ai_urgency text NOT NULL DEFAULT 'medium', -- low | medium | high | emergency
  recommended_specialization text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending', -- pending | assigned | in_review | closed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_reports TO authenticated;
GRANT ALL ON public.symptom_reports TO service_role;

ALTER TABLE public.symptom_reports ENABLE ROW LEVEL SECURITY;

-- helper: is the current user a doctor belonging to the given clinic?
CREATE OR REPLACE FUNCTION public.doctor_in_clinic(_user_id uuid, _clinic_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND clinic_id = _clinic_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.doctor_in_clinic(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.doctor_in_clinic(uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Patient/doctor/admin view reports"
  ON public.symptom_reports FOR SELECT TO authenticated
  USING (
    auth.uid() = patient_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.doctor_in_clinic(auth.uid(), clinic_id)
  );

CREATE POLICY "Patient inserts own report"
  ON public.symptom_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctor or admin updates clinic reports"
  ON public.symptom_reports FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.doctor_in_clinic(auth.uid(), clinic_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.doctor_in_clinic(auth.uid(), clinic_id)
  );

CREATE POLICY "Admins delete reports"
  ON public.symptom_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER symptom_reports_updated_at
  BEFORE UPDATE ON public.symptom_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_symptom_reports_patient ON public.symptom_reports(patient_id);
CREATE INDEX idx_symptom_reports_clinic ON public.symptom_reports(clinic_id);
CREATE INDEX idx_symptom_reports_doctor ON public.symptom_reports(assigned_doctor_id);

-- ============ Update new-user triggers to branch by role metadata ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := coalesce(NEW.raw_user_meta_data ->> 'role', 'doctor');
BEGIN
  IF v_role = 'patient' THEN
    INSERT INTO public.patient_profiles (
      user_id, full_name, phone, gender, language, date_of_birth
    )
    VALUES (
      NEW.id,
      coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
      coalesce(NEW.phone, NEW.raw_user_meta_data ->> 'phone', ''),
      coalesce(NEW.raw_user_meta_data ->> 'gender', ''),
      coalesce(NEW.raw_user_meta_data ->> 'language', 'uz'),
      NULLIF(NEW.raw_user_meta_data ->> 'date_of_birth', '')::date
    )
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.profiles (user_id, full_name, hospital)
    VALUES (
      NEW.id,
      coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
      coalesce(NEW.raw_user_meta_data ->> 'hospital', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := coalesce(NEW.raw_user_meta_data ->> 'role', 'doctor');
BEGIN
  IF v_role = 'patient' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient'::public.app_role)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'doctor'::public.app_role)
    ON CONFLICT DO NOTHING;

    IF NEW.email = 'mamatxalilovamashzuraxon0708@gmail.com' THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'admin'::public.app_role)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
