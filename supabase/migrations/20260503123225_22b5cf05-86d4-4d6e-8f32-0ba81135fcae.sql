
-- Grant execute permission on has_role to authenticated users (it's used in RLS policies)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_pro(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.daily_usage_count(uuid) TO authenticated;

-- Manually assign admin + doctor roles to the existing admin user
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE email = 'mamatxalilovamashzuraxon0708@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'doctor'::public.app_role FROM auth.users
WHERE email = 'mamatxalilovamashzuraxon0708@gmail.com'
ON CONFLICT DO NOTHING;

-- Ensure the trigger is attached to auth.users for future signups
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
