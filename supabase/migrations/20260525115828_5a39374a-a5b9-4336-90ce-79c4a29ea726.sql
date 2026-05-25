-- Tighten consultations SELECT
DROP POLICY IF EXISTS "Authenticated doctors view all consultations" ON public.consultations;
CREATE POLICY "Doctors view own consultations"
  ON public.consultations FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten prescriptions_log SELECT
DROP POLICY IF EXISTS "Logs readable by authenticated users" ON public.prescriptions_log;
CREATE POLICY "Doctors view own logs"
  ON public.prescriptions_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Tighten profiles SELECT
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
CREATE POLICY "Users view own or admin views all"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Aggregate-only platform stats for the Analytics page (no PII)
CREATE OR REPLACE FUNCTION public.platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctors int;
  v_hospitals int;
  v_prescriptions int;
  v_last7d int;
  v_top_hospitals jsonb;
  v_recent_count int;
BEGIN
  SELECT COUNT(*)::int INTO v_doctors FROM public.profiles;

  SELECT COUNT(DISTINCT lower(btrim(hospital)))::int
    INTO v_hospitals
    FROM public.profiles
    WHERE coalesce(btrim(hospital), '') <> '';

  SELECT COUNT(*)::int INTO v_prescriptions FROM public.prescriptions_log;

  SELECT COUNT(*)::int INTO v_last7d
    FROM public.prescriptions_log
    WHERE created_at > now() - interval '7 days';

  SELECT COALESCE(jsonb_agg(jsonb_build_object('hospital', hospital, 'count', cnt) ORDER BY cnt DESC), '[]'::jsonb)
    INTO v_top_hospitals
    FROM (
      SELECT COALESCE(NULLIF(btrim(hospital), ''), '—') AS hospital, COUNT(*)::int AS cnt
      FROM public.prescriptions_log
      GROUP BY 1
      ORDER BY cnt DESC
      LIMIT 5
    ) t;

  RETURN jsonb_build_object(
    'doctors', v_doctors,
    'hospitals', v_hospitals,
    'prescriptions', v_prescriptions,
    'last7d', v_last7d,
    'topHospitals', v_top_hospitals
  );
END;
$$;

REVOKE ALL ON FUNCTION public.platform_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.platform_stats() TO authenticated;