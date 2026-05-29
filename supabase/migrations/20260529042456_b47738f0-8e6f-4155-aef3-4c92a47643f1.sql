CREATE OR REPLACE FUNCTION public.ensure_patient_account(
  _full_name text DEFAULT '',
  _phone text DEFAULT '',
  _gender text DEFAULT '',
  _language text DEFAULT 'uz',
  _date_of_birth date DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'patient'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.patient_profiles (
    user_id,
    full_name,
    phone,
    gender,
    language,
    date_of_birth
  )
  VALUES (
    v_user_id,
    coalesce(nullif(btrim(_full_name), ''), ''),
    coalesce(nullif(btrim(_phone), ''), ''),
    coalesce(nullif(btrim(_gender), ''), ''),
    coalesce(nullif(btrim(_language), ''), 'uz'),
    _date_of_birth
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = coalesce(nullif(btrim(excluded.full_name), ''), public.patient_profiles.full_name),
    phone = coalesce(nullif(btrim(excluded.phone), ''), public.patient_profiles.phone),
    gender = coalesce(nullif(btrim(excluded.gender), ''), public.patient_profiles.gender),
    language = coalesce(nullif(btrim(excluded.language), ''), public.patient_profiles.language),
    date_of_birth = coalesce(excluded.date_of_birth, public.patient_profiles.date_of_birth),
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_patient_account(text, text, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_patient_account(text, text, text, text, date) TO service_role;