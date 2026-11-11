REVOKE ALL ON FUNCTION public.ensure_patient_account(text, text, text, text, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.require_document_approval_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_pro(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated, service_role;