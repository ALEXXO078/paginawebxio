import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Lectura pública del catálogo (solo productos activos, por permisos de la base)
export const getCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_")) {
          headers.delete("Authorization");
          headers.set("apikey", key);
        }
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data, error } = await sb.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
  if (error) throw new Error("No se pudo cargar el catálogo");
  return data;
});
