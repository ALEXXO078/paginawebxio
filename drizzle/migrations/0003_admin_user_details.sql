CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  address text,
  city text,
  created_at timestamptz,
  is_admin boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id,
    u.email,
    p.full_name,
    p.phone,
    p.address,
    p.city,
    u.created_at,
    EXISTS (
      SELECT 1
      FROM public.user_roles r
      WHERE r.user_id = u.id AND r.role = 'admin'
    ) AS is_admin
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY u.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;