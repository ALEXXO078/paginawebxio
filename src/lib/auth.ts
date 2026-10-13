import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function getConfiguredAdminEmails(): string[] {
  const raw = [
    import.meta.env?.VITE_ADMIN_EMAILS,
    import.meta.env?.VITE_ADMIN_EMAIL,
    import.meta.env?.ADMIN_EMAIL,
  ]
    .filter(Boolean)
    .join(",");

  return [...new Set(
    raw
      .split(/[\n,;]/)
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )];
}

export function isAdminEmail(email?: string | null): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return getConfiguredAdminEmails().includes(normalized);
}

export function canAccessAdmin(userEmail?: string | null, hasRole = false): boolean {
  return Boolean(hasRole || isAdminEmail(userEmail));
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, loading };
}
