CREATE OR REPLACE FUNCTION public.set_admin_role(_user_id uuid, _enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF _user_id = auth.uid() AND NOT _enabled THEN
    RAISE EXCEPTION 'No puedes quitarte tu propio permiso de administrador';
  END IF;

  IF _enabled THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin';
  END IF;

  RETURN _enabled;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_admin_role(uuid, boolean) TO authenticated;