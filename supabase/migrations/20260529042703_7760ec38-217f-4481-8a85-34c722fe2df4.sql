REVOKE EXECUTE ON FUNCTION public.ensure_patient_account(text, text, text, text, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_patient_account(text, text, text, text, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_patient_account(text, text, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_patient_account(text, text, text, text, date) TO service_role;