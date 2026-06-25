CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  END IF;
  RETURN NEW;
END;
$function$;