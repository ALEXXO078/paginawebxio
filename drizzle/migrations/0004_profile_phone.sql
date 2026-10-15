CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    CASE WHEN lower(new.email) = 'admin@adsstore.com' THEN 'admin'::public.app_role ELSE 'customer'::public.app_role END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;