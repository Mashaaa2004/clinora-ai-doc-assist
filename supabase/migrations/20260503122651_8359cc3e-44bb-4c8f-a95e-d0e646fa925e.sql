
TRUNCATE TABLE public.consultations RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.prescriptions_log RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.payment_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.subscriptions RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.user_roles RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;

DELETE FROM auth.users;

CREATE OR REPLACE FUNCTION public.daily_usage_count(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.consultations
  WHERE user_id = _user_id
    AND created_at >= date_trunc('day', now());
$$;
