CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.profiles (user_id, full_name, hospital)
    VALUES (
      NEW.id,
      coalesce(NEW.raw_user_meta_data ->> 'full_name', ''),
      coalesce(NEW.raw_user_meta_data ->> 'hospital', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'doctor'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Backfill patient role for existing patient_profiles missing role
INSERT INTO public.user_roles (user_id, role)
SELECT pp.user_id, 'patient'::app_role
FROM public.patient_profiles pp
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = pp.user_id AND ur.role = 'patient'
)
ON CONFLICT (user_id, role) DO NOTHING;