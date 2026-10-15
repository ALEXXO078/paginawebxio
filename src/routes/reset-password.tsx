import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña │ ADS Store" },
      { name: "description", content: "Define una nueva contraseña para tu cuenta ADS Store." },
      { property: "og:title", content: "Nueva contraseña │ ADS Store" },
      { property: "og:description", content: "Cambia tu contraseña de ADS Store." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pass, setPass] = useState("");
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pass.length < 8) { toast.error("Mínimo 8 caracteres"); return; }
    const { error } = await supabase.auth.updateUser({ password: pass });
    if (error) { toast.error("El enlace expiró. Solicita uno nuevo."); return; }
    toast.success("Contraseña actualizada");
    navigate({ to: "/cuenta" });
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <form onSubmit={submit} className="mx-auto max-w-md space-y-4 px-4 py-16">
        <h1 className="font-display text-4xl font-black uppercase">Nueva contraseña</h1>
        <input type="password" className="w-full border bg-background px-4 py-3 text-sm" placeholder="Nueva contraseña" value={pass} onChange={(e) => setPass(e.target.value)} />
        <button className="w-full bg-primary py-4 text-xs font-bold uppercase tracking-widest text-primary-foreground">Guardar</button>
      </form>
    </div>
  );
}
