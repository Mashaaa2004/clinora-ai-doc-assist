
-- Restrict execute on internal helpers (still callable from RLS as definer)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_pro(uuid) FROM anon, public;
-- Allow authenticated to call is_pro for client checks
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
