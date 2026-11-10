-- Protect privileged clinic mapping from ordinary profile edits.
CREATE OR REPLACE FUNCTION public.protect_profile_clinic_mapping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.clinic_id IS NOT NULL OR NULLIF(BTRIM(COALESCE(NEW.base44_doctor_id, '')), '') IS NOT NULL THEN
        RAISE EXCEPTION 'Clinic mapping requires an administrator';
      END IF;
    ELSIF NEW.clinic_id IS DISTINCT FROM OLD.clinic_id
      OR NEW.base44_doctor_id IS DISTINCT FROM OLD.base44_doctor_id THEN
      RAISE EXCEPTION 'Clinic mapping requires an administrator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_clinic_mapping ON public.profiles;
CREATE TRIGGER profiles_protect_clinic_mapping
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_clinic_mapping();

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
  ) AND public.has_role(_user_id, 'doctor')
$$;

REVOKE EXECUTE ON FUNCTION public.doctor_in_clinic(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.doctor_in_clinic(uuid, uuid) TO authenticated, service_role;

ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS patient_reference text;

CREATE TABLE public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ai_usage_events TO authenticated;
GRANT ALL ON public.ai_usage_events TO service_role;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own AI usage"
ON public.ai_usage_events FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE INDEX ai_usage_events_user_day_idx ON public.ai_usage_events (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.daily_usage_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.ai_usage_events
  WHERE user_id = _user_id
    AND created_at >= date_trunc('day', now())
    AND (auth.uid() = _user_id OR public.has_role(auth.uid(), 'admin'))
$$;

CREATE OR REPLACE FUNCTION public.consume_ai_usage(_user_id uuid, _function_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Authenticated owner required';
  END IF;
  IF NOT (public.has_role(_user_id, 'doctor') OR public.has_role(_user_id, 'admin')) THEN
    RAISE EXCEPTION 'Clinician required';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(_user_id::text));
  IF NOT public.is_pro(_user_id) AND public.daily_usage_count(_user_id) >= 5 THEN
    RETURN false;
  END IF;
  INSERT INTO public.ai_usage_events (user_id, function_name)
  VALUES (_user_id, LEFT(COALESCE(_function_name, 'analyze'), 40));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.daily_usage_count(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_ai_usage(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.daily_usage_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_usage(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_clinical_draft(draft_id uuid, decision text, edited jsonb, final_record jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d public.clinical_drafts;
  cid uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Clinician required';
  END IF;
  SELECT * INTO d FROM public.clinical_drafts WHERE id = draft_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR d.status <> 'draft' THEN
    RAISE EXCEPTION 'Editable own draft required';
  END IF;
  IF decision = 'rejected' THEN
    UPDATE public.clinical_drafts SET status = 'rejected', edited_analysis = edited WHERE id = draft_id;
    RETURN NULL;
  END IF;
  IF decision <> 'approved' OR final_record IS NULL OR trim(coalesce(final_record->>'diagnosis', '')) = '' THEN
    RAISE EXCEPTION 'Explicit approval and final diagnosis required';
  END IF;
  INSERT INTO public.consultations (
    user_id, patient_name, patient_reference, patient_code, transcript, symptoms, diagnosis,
    chosen_diagnosis, differentials, recommendation, prescriptions, lab_tests,
    instrumental_tests, family_advice, language, started_at, ended_at, duration_seconds,
    document_status, approved_at, clinical_document, protocol_refs
  ) VALUES (
    auth.uid(), coalesce(final_record->>'patient_name', ''), nullif(trim(coalesce(final_record->>'patient_reference', '')), ''),
    coalesce(final_record->>'patient_code', ''), coalesce(final_record->>'transcript', ''),
    coalesce(edited->'symptoms', '[]'), final_record->>'diagnosis', final_record->>'diagnosis',
    coalesce(edited->'differentials', '[]'), coalesce(edited->>'recommendation', ''),
    coalesce(edited->'prescriptions', '[]'), coalesce(edited->'lab_tests', '[]'),
    coalesce(edited->'instrumental_tests', '[]'), coalesce(edited->>'family_advice', ''),
    coalesce(final_record->>'language', 'uz'), (final_record->>'started_at')::timestamptz,
    now(), (final_record->>'duration_seconds')::integer, 'approved', now(), edited,
    coalesce(d.original_analysis->'protocol_refs', '[]')
  ) RETURNING id INTO cid;
  UPDATE public.clinical_drafts
  SET status = 'approved', edited_analysis = edited, consultation_id = cid, approved_at = now()
  WHERE id = draft_id;
  RETURN cid;
END;
$$;

REVOKE ALL ON FUNCTION public.review_clinical_draft(uuid, text, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_clinical_draft(uuid, text, jsonb, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_public_verification(_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'consultation', jsonb_build_object(
      'id', c.id,
      'patient_name', c.patient_name,
      'patient_code', c.patient_code,
      'chosen_diagnosis', c.chosen_diagnosis,
      'diagnosis', c.diagnosis,
      'recommendation', c.recommendation,
      'prescriptions', c.prescriptions,
      'lab_tests', c.lab_tests,
      'instrumental_tests', c.instrumental_tests,
      'symptoms', c.symptoms,
      'family_advice', c.family_advice,
      'created_at', c.created_at,
      'language', c.language,
      'document_status', c.document_status
    ),
    'doctor', jsonb_build_object(
      'full_name', p.full_name,
      'hospital', p.hospital,
      'specialty', p.specialty,
      'phone', p.phone,
      'work_hours', p.work_hours,
      'hospital_address', p.hospital_address,
      'hospital_phone', p.hospital_phone
    )
  )
  FROM public.consultations c
  LEFT JOIN public.profiles p ON p.user_id = c.user_id
  WHERE c.id = _id AND c.document_status = 'approved'
$$;

REVOKE ALL ON FUNCTION public.get_public_verification(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_verification(uuid) TO anon, authenticated;