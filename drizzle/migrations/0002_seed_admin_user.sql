-- Promote the configured administrator without changing existing customer roles.
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  SELECT id
    INTO admin_user_id
    FROM auth.users
   WHERE lower(email) = 'admin@adsstore.com'
   LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name)
    SELECT admin_user_id, coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name')
      FROM auth.users
     WHERE id = admin_user_id
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    CASE WHEN lower(new.email) = 'admin@adsstore.com' THEN 'admin'::public.app_role ELSE 'customer'::public.app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;