import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { canAccessAdmin, isAdminEmail } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar o crear cuenta │ ADS Store" },
      { name: "description", content: "Inicia sesión o regístrate en ADS Store para guardar favoritos y ver tus pedidos." },
      { property: "og:title", content: "Ingresar │ ADS Store" },
      { property: "og:description", content: "Accede a tu cuenta ADS Store." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Correo inválido").max(255);
const passSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72);
const phoneSchema = z.string().trim().min(7, "Número telefónico inválido").max(20, "Número telefónico inválido");

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const em = emailSchema.safeParse(email);
    if (!em.success) { toast.error(em.error.issues[0]?.message ?? "Dato inválido"); return; }
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(em.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Revisa tu correo", { description: "Te enviamos un enlace para cambiar tu contraseña." });
        setMode("login");
        return;
      }
      const ps = passSchema.safeParse(pass);
      if (!ps.success) { toast.error(ps.error.issues[0]?.message ?? "Dato inválido"); return; }
      if (mode === "signup") {
        if (name.trim().length < 2) { toast.error("Ingresa tu nombre"); return; }
        const ph = phoneSchema.safeParse(phone);
        if (!ph.success) { toast.error(ph.error.issues[0]?.message ?? "Número telefónico inválido"); return; }
        const { error } = await supabase.auth.signUp({
          email: em.data,
          password: ps.data,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name.trim().slice(0, 100), phone: ph.data },
          },
        });
        if (error) throw error;
        toast.success("¡Cuenta creada!", { description: "Revisa tu correo para confirmar tu cuenta." });
        setMode("login");
      } else {
        const { data: signedIn, error } = await supabase.auth.signInWithPassword({ email: em.data, password: ps.data });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            throw new Error("Confirma tu correo electrónico antes de iniciar sesión");
          }
          throw new Error("Correo o contraseña incorrectos");
        }

        const { data: adminRole } = await supabase.rpc("has_role", {
          _user_id: signedIn.user.id,
          _role: "admin",
        });

        const nextRoute = canAccessAdmin(signedIn.user.email, Boolean(adminRole)) ? "/admin" : "/cuenta";
        toast.success(isAdminEmail(signedIn.user.email) ? "¡Acceso de administrador!" : "¡Bienvenido!");
        navigate({ to: nextRoute });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("No se pudo ingresar con Google");
  }

  const title = mode === "login" ? "Ingresar" : mode === "signup" ? "Crear cuenta" : "Recuperar contraseña";
  const input = "w-full border bg-background px-4 py-3 text-sm outline-none focus:border-foreground";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-4xl font-black uppercase">{title}</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <input className={input} placeholder="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          )}
          {mode === "signup" && (
            <input className={input} type="tel" placeholder="Número telefónico" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} required />
          )}
          <input className={input} type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode !== "forgot" && (
            <input className={input} type="password" placeholder="Contraseña (mín. 8 caracteres)" value={pass} onChange={(e) => setPass(e.target.value)} required />
          )}
          <button disabled={busy} className="w-full bg-primary py-4 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
            {busy ? "Procesando…" : mode === "forgot" ? "Enviar enlace" : title}
          </button>
        </form>
        {mode !== "forgot" && (
          <button onClick={google} className="mt-3 w-full border py-4 text-xs font-bold uppercase tracking-widest hover:bg-cream">
            Continuar con Google
          </button>
        )}
        <div className="mt-6 flex flex-col gap-2 text-sm">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("signup")} className="text-left underline">¿No tienes cuenta? Regístrate</button>
              <button onClick={() => setMode("forgot")} className="text-left text-muted-foreground underline">Olvidé mi contraseña</button>
            </>
          )}
          {mode !== "login" && <button onClick={() => setMode("login")} className="text-left underline">Ya tengo cuenta, ingresar</button>}
        </div>
      </div>
    </div>
  );
}
