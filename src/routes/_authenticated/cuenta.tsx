import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { pen } from "@/lib/products";
import { useCatalogLazy } from "@/lib/catalog";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/_authenticated/cuenta")({
  head: () => ({
    meta: [
      { title: "Mi cuenta │ ADS Store" },
      { name: "description", content: "Tus datos, pedidos y favoritos en ADS Store." },
      { property: "og:title", content: "Mi cuenta │ ADS Store" },
      { property: "og:description", content: "Administra tu cuenta ADS Store." },
    ],
  }),
  component: Cuenta,
});

type Line = { name: string; size: string; qty: number; price: number };

function Cuenta() {
  const { get: getProduct } = useCatalogLazy();
  const [tab, setTab] = useState<"pedidos" | "favoritos" | "datos">("pedidos");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const orders = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await supabase.from("orders").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const favs = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => (await supabase.from("favorites").select("product_slug")).data ?? [],
  });

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-5xl font-black uppercase">Mi cuenta</h1>
          <button onClick={logout} className="text-sm underline">Cerrar sesión</button>
        </div>
        <div className="mt-6 flex gap-2 border-b">
          {(["pedidos", "favoritos", "datos"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-3 text-xs font-bold uppercase tracking-widest ${tab === t ? "border-b-2 border-foreground" : "text-muted-foreground"}`}>
              {t === "datos" ? "Mis datos" : t}
            </button>
          ))}
        </div>

        {tab === "pedidos" && (
          <div className="mt-6 space-y-4">
            {orders.isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
            {orders.data?.length === 0 && <Empty text="Aún no tienes pedidos." />}
            {orders.data?.map((o) => (
              <div key={o.id} className="border p-4">
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-bold">#{o.id.slice(0, 8).toUpperCase()}</span>
                  <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("es-PE")}</span>
                  <span className="bg-cream px-2 py-1 text-xs font-bold uppercase">{o.status}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {(o.items as Line[]).map((l, i) => (
                    <li key={i}>{l.name} · Talla {l.size} x{l.qty} — {pen(l.price * l.qty)}</li>
                  ))}
                </ul>
                <p className="mt-3 text-right font-bold">Total {pen(Number(o.total))}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "favoritos" && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {favs.data?.length === 0 && <div className="col-span-full"><Empty text="No tienes favoritos todavía." /></div>}
            {favs.data?.map((f) => {
              const p = getProduct(f.product_slug);
              if (!p) return null;
              return (
                <Link key={p.slug} to="/producto/$slug" params={{ slug: p.slug }}>
                  <img src={p.img} alt={p.name} className="aspect-[3/4] w-full object-cover" />
                  <p className="mt-2 text-sm font-semibold">{p.name}</p>
                  <p className="text-sm">{pen(p.price)}</p>
                </Link>
              );
            })}
          </div>
        )}

        {tab === "datos" && <Datos />}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="py-12 text-center">
      <p className="font-semibold">{text}</p>
      <Link to="/tienda" className="mt-2 inline-block text-sm underline">Explorar la tienda</Link>
    </div>
  );
}

function Datos() {
  const [f, setF] = useState({ full_name: "", phone: "", address: "", city: "" });
  const [email, setEmail] = useState("");
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p) setF({ full_name: p.full_name ?? "", phone: p.phone ?? "", address: p.address ?? "", city: p.city ?? "" });
    });
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.phone && !/^[0-9 +]{6,15}$/.test(f.phone)) { toast.error("Teléfono inválido"); return; }
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const clean = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim().slice(0, 200)]));
    const { error } = await supabase.from("profiles").upsert({ id: data.user.id, ...clean });
    if (error) { toast.error("No se pudo guardar"); return; }
    toast.success("Datos actualizados");
  }
  const input = "w-full border bg-background px-4 py-3 text-sm";
  return (
    <form onSubmit={save} className="mt-6 max-w-md space-y-4">
      <p className="text-sm text-muted-foreground">{email}</p>
      <input className={input} placeholder="Nombre completo" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
      <input className={input} placeholder="Teléfono" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <input className={input} placeholder="Dirección" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
      <input className={input} placeholder="Ciudad / distrito" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
      <button className="bg-primary px-8 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground">Guardar</button>
    </form>
  );
}
