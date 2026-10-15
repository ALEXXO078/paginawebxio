import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LayoutDashboard, Package, ShoppingCart, Users, ArrowLeft, Plus, Pencil, Trash2, EyeOff, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { canAccessAdmin } from "@/lib/auth";
import { categories, pen, resolveImage, assetKeys, type ProductRow } from "@/lib/products";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });

    const { data: role } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!canAccessAdmin(u.user.email, Boolean(role))) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Panel administrativo │ ADS Store" },
      { name: "description", content: "Gestión de productos, pedidos y clientes de ADS Store." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const STATUSES = ["pendiente", "procesado", "completado", "cancelado"] as const;
const LOW_STOCK = 5;
type Tab = "resumen" | "productos" | "pedidos" | "clientes";
type Line = { slug: string; name: string; size: string; qty: number; price: number };

const allCats = [...new Set(["Ropa", "Botas", "Sandalias", ...categories.map((c) => c.name).filter((c) => c !== "Ofertas")])];

function useAdminData() {
  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ProductRow[] & { created_at: string }[];
    },
  });
  const orders = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const profiles = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return { products, orders, profiles };
}

function Admin() {
  const [tab, setTab] = useState<Tab>("resumen");
  const d = useAdminData();
  const tabs: { id: Tab; l: string; i: typeof Package }[] = [
    { id: "resumen", l: "Resumen", i: LayoutDashboard },
    { id: "productos", l: "Productos", i: Package },
    { id: "pedidos", l: "Pedidos", i: ShoppingCart },
    { id: "clientes", l: "Clientes", i: Users },
  ];
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <span className="font-display text-lg font-black uppercase">ADS Store · Admin</span>
          <Link to="/" className="flex items-center gap-1 text-xs font-semibold uppercase hover:opacity-70">
            <ArrowLeft className="h-4 w-4" /> Ver tienda
          </Link>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wide ${tab === t.id ? "bg-background text-foreground" : "opacity-70 hover:opacity-100"}`}
            >
              <t.i className="h-4 w-4" /> {t.l}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {tab === "resumen" && <Resumen d={d} />}
        {tab === "productos" && <Productos d={d} />}
        {tab === "pedidos" && <Pedidos d={d} />}
        {tab === "clientes" && <Clientes d={d} />}
      </main>
    </div>
  );
}

type D = ReturnType<typeof useAdminData>;

function Card({ l, v, hint }: { l: string; v: string | number; hint?: string }) {
  return (
    <div className="border bg-background p-5">
      <p className="text-xs font-bold uppercase text-muted-foreground">{l}</p>
      <p className="mt-2 font-display text-3xl font-black">{v}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Resumen({ d }: { d: D }) {
  const products = d.products.data ?? [];
  const orders = d.orders.data ?? [];
  if (d.products.isLoading || d.orders.isLoading) return <p>Cargando…</p>;
  const by = (s: string) => orders.filter((o) => o.status === s).length;
  const revenue = orders.filter((o) => o.status === "completado").reduce((a, o) => a + Number(o.total), 0);
  const sold = new Map<string, { name: string; qty: number }>();
  orders.filter((o) => o.status !== "cancelado").forEach((o) =>
    (o.items as Line[]).forEach((l) => {
      const c = sold.get(l.slug) ?? { name: l.name, qty: 0 };
      c.qty += l.qty;
      sold.set(l.slug, c);
    }),
  );
  const top = [...sold.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const low = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK);
  const out = products.filter((p) => p.stock <= 0);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card l="Clientes registrados" v={d.profiles.data?.length ?? 0} />
        <Card l="Productos" v={products.length} hint={`${products.filter((p) => p.active).length} visibles`} />
        <Card l="Stock bajo" v={low.length} hint={`${LOW_STOCK} unidades o menos`} />
        <Card l="Agotados" v={out.length} />
        <Card l="Pedidos" v={orders.length} />
        <Card l="Pendientes" v={by("pendiente")} />
        <Card l="Procesados" v={by("procesado")} />
        <Card l="Completados" v={by("completado")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border bg-background p-5">
          <p className="text-xs font-bold uppercase text-muted-foreground">Ventas registradas</p>
          <p className="mt-2 font-display text-3xl font-black">{pen(revenue)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Suma de pedidos marcados como completados. Los pagos se confirman por WhatsApp, fuera de la tienda.</p>
        </div>
        <div className="border bg-background p-5">
          <p className="text-xs font-bold uppercase text-muted-foreground">Más vendidos</p>
          {top.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Aún no hay pedidos para calcularlo.</p>
          ) : (
            <ol className="mt-3 space-y-1 text-sm">
              {top.map((t) => <li key={t.name} className="flex justify-between"><span>{t.name}</span><b>{t.qty} u.</b></li>)}
            </ol>
          )}
        </div>
      </div>
      <div className="border bg-background p-5">
        <p className="text-xs font-bold uppercase text-muted-foreground">Actividad reciente</p>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Todavía no hay pedidos registrados.</p>
        ) : (
          <ul className="mt-3 divide-y text-sm">
            {orders.slice(0, 6).map((o) => (
              <li key={o.id} className="flex justify-between py-2">
                <span>Pedido #{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleString("es-PE")}</span>
                <span className="font-semibold capitalize">{o.status} · {pen(Number(o.total))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(low.length > 0 || out.length > 0) && (
        <div className="border bg-background p-5">
          <p className="text-xs font-bold uppercase text-muted-foreground">Revisar stock</p>
          <ul className="mt-3 space-y-1 text-sm">
            {[...out, ...low].map((p) => <li key={p.slug} className="flex justify-between"><span>{p.name}</span><b className={p.stock <= 0 ? "text-sale" : ""}>{p.stock <= 0 ? "Agotado" : `${p.stock} u.`}</b></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------- Productos ---------------- */

const empty = {
  slug: "", name: "", category: "Ropa", sub: "", price: "", old_price: "", stock: "0", size_type: "ropa",
  sizes: "XS, S, M, L, XL", soldout: "", images: "", description: "", details: "", active: true, is_demo: false,
};
type Form = typeof empty;

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

function toForm(p: ProductRow): Form {
  const sizes = (p.sizes as { label: string; available: boolean }[]) ?? [];
  return {
    slug: p.slug, name: p.name, category: p.category, sub: p.sub ?? "", price: String(p.price),
    old_price: p.old_price != null ? String(p.old_price) : "", stock: String(p.stock), size_type: p.size_type,
    sizes: sizes.map((s) => s.label).join(", "), soldout: sizes.filter((s) => !s.available).map((s) => s.label).join(", "),
    images: p.images.join("\n"), description: p.description, details: p.details.join("\n"), active: p.active, is_demo: p.is_demo,
  };
}

function Productos({ d }: { d: D }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [editing, setEditing] = useState<{ form: Form; isNew: boolean } | null>(null);
  const list = (d.products.data ?? []).filter(
    (p) => (!cat || p.category === cat) && (p.name + p.slug + (p.sub ?? "")).toLowerCase().includes(q.toLowerCase()),
  );
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  async function toggle(p: ProductRow) {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("slug", p.slug);
    if (error) { toast.error("No se pudo actualizar"); return; }
    toast.success(p.active ? "Producto oculto de la tienda" : "Producto visible en la tienda");
    refresh();
  }
  async function remove(p: ProductRow) {
    if (!window.confirm(`¿Eliminar "${p.name}" definitivamente? Los pedidos anteriores no se modifican. Si solo quieres quitarlo de la tienda, usa "Ocultar".`)) return;
    const { error } = await supabase.from("products").delete().eq("slug", p.slug);
    if (error) { toast.error("No se pudo eliminar"); return; }
    toast.success("Producto eliminado");
    refresh();
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto…" className="flex-1 border bg-background px-4 py-2.5 text-sm" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="border bg-background px-4 py-2.5 text-sm">
          <option value="">Todas las categorías</option>
          {allCats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => setEditing({ form: { ...empty }, isNew: true })} className="flex items-center justify-center gap-2 bg-primary px-5 py-2.5 text-xs font-bold uppercase text-primary-foreground">
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>
      <div className="mt-4 overflow-x-auto border bg-background">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th className="text-right pr-3">Acciones</th></tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.slug} className="border-b last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={resolveImage(p.images[0] ?? "")} alt="" className="h-12 w-10 bg-cream object-cover" />
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.slug}{p.is_demo && " · demo"}</p>
                    </div>
                  </div>
                </td>
                <td>{p.category}{p.sub && <span className="text-muted-foreground"> · {p.sub}</span>}</td>
                <td>{pen(Number(p.price))}{p.old_price && <span className="ml-1 text-xs text-muted-foreground line-through">{pen(Number(p.old_price))}</span>}</td>
                <td className={p.stock <= 0 ? "font-bold text-sale" : p.stock <= LOW_STOCK ? "font-bold" : ""}>{p.stock <= 0 ? "Agotado" : p.stock}</td>
                <td>{p.active ? "Visible" : <span className="text-muted-foreground">Oculto</span>}</td>
                <td className="pr-3">
                  <div className="flex justify-end gap-1">
                    <button title="Editar" onClick={() => setEditing({ form: toForm(p), isNew: false })} className="p-2 hover:bg-cream"><Pencil className="h-4 w-4" /></button>
                    <button title={p.active ? "Ocultar" : "Mostrar"} onClick={() => toggle(p)} className="p-2 hover:bg-cream">{p.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    <button title="Eliminar" onClick={() => remove(p)} className="p-2 text-sale hover:bg-cream"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No hay productos con ese filtro.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && <ProductForm initial={editing.form} isNew={editing.isNew} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </div>
  );
}

function ProductForm({ initial, isNew, onClose, onSaved }: { initial: Form; isNew: boolean; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Form>(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof Form, v: string | boolean) => setF((s) => ({ ...s, [k]: v }));
  const subs = categories.find((c) => c.name === f.category)?.subs ?? [];
  const imgs = f.images.split("\n").map((s) => s.trim()).filter(Boolean);

  async function uploadImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} supera el límite de 5 MB`);
        continue;
      }
      const fileName = file.name.toLowerCase().replace(/[^a-z0-9._-]/g, "-");
      const path = `products/${crypto.randomUUID()}-${fileName}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
      if (error) {
        toast.error(`No se pudo subir ${file.name}`);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    if (uploaded.length > 0) {
      set("images", [...imgs, ...uploaded].join("\n"));
      toast.success(`${uploaded.length} imagen${uploaded.length === 1 ? "" : "es"} subida${uploaded.length === 1 ? "" : "s"}`);
    }
    setUploading(false);
  }

  async function save() {
    const slug = isNew ? slugify(f.slug || f.name) : f.slug;
    const price = Number(f.price);
    const old = f.old_price ? Number(f.old_price) : null;
    const stock = Number(f.stock);
    if (!f.name.trim() || f.name.length > 120) { toast.error("Escribe un nombre (máx. 120 letras)"); return; }
    if (!slug) { toast.error("Código inválido"); return; }
    if (!(price > 0)) { toast.error("El precio debe ser mayor a 0"); return; }
    if (old != null && !(old > price)) { toast.error("El precio anterior debe ser mayor al precio actual para que sea oferta"); return; }
    if (!Number.isInteger(stock) || stock < 0) { toast.error("El stock debe ser un número entero de 0 o más"); return; }
    if (imgs.length === 0) { toast.error("Agrega al menos una foto"); return; }
    const labels = f.sizes.split(",").map((s) => s.trim()).filter(Boolean);
    if (labels.length === 0) { toast.error("Agrega al menos una talla o variante (ej. Única)"); return; }
    const sold = f.soldout.split(",").map((s) => s.trim());
    const row = {
      slug, name: f.name.trim(), category: f.category, sub: f.sub || null, price, old_price: old, stock,
      size_type: f.size_type, sizes: labels.map((label) => ({ label, available: !sold.includes(label) })),
      images: imgs, description: f.description.trim(), details: f.details.split("\n").map((s) => s.trim()).filter(Boolean),
      active: f.active, is_demo: f.is_demo,
    };
    setBusy(true);
    const { error } = isNew ? await supabase.from("products").insert(row) : await supabase.from("products").update(row).eq("slug", slug);
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? "Ya existe un producto con ese código" : "No se pudo guardar"); return; }
    toast.success(isNew ? "Producto creado" : "Cambios guardados");
    onSaved();
  }

  const input = "w-full border bg-background px-3 py-2 text-sm";
  const label = "mb-1 block text-xs font-bold uppercase text-muted-foreground";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-background p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-black uppercase">{isNew ? "Nuevo producto" : "Editar producto"}</h2>
          <button onClick={onClose} aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className={label}>Nombre</label><input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          {isNew && <div className="col-span-2"><label className={label}>Código (opcional)</label><input className={input} value={f.slug} placeholder={slugify(f.name)} onChange={(e) => set("slug", e.target.value)} /></div>}
          <div><label className={label}>Categoría</label>
            <select className={input} value={f.category} onChange={(e) => { set("category", e.target.value); set("sub", ""); }}>{allCats.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className={label}>Marca / tipo</label>
            <select className={input} value={f.sub} onChange={(e) => set("sub", e.target.value)} disabled={subs.length === 0}>
              <option value="">—</option>{subs.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div><label className={label}>Precio (S/)</label><input type="number" step="0.01" min="0" className={input} value={f.price} onChange={(e) => set("price", e.target.value)} /></div>
          <div><label className={label}>Precio anterior (oferta)</label><input type="number" step="0.01" min="0" className={input} value={f.old_price} placeholder="Vacío = sin oferta" onChange={(e) => set("old_price", e.target.value)} /></div>
          <div><label className={label}>Stock</label><input type="number" min="0" className={input} value={f.stock} onChange={(e) => set("stock", e.target.value)} /></div>
          <div><label className={label}>Tipo de talla</label>
            <select className={input} value={f.size_type} onChange={(e) => set("size_type", e.target.value)}><option value="ropa">Ropa</option><option value="calzado">Calzado</option></select></div>
          <div className="col-span-2"><label className={label}>Tallas / variantes (separadas por coma)</label><input className={input} value={f.sizes} onChange={(e) => set("sizes", e.target.value)} /></div>
          <div className="col-span-2"><label className={label}>Tallas agotadas (separadas por coma)</label><input className={input} value={f.soldout} onChange={(e) => set("soldout", e.target.value)} /></div>
          <div className="col-span-2">
            <label className={label}>Fotos</label>
            <input type="file" accept="image/*" multiple className={`${input} file:mr-3 file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-primary-foreground`} onChange={uploadImages} disabled={uploading} />
            <p className="mt-1 text-xs text-muted-foreground">Puedes subir varias imágenes desde tu PC. Máximo 5 MB por imagen.</p>
            <textarea rows={3} className={input} value={f.images} onChange={(e) => set("images", e.target.value)} placeholder="https://…" />
            <p className="mt-2 text-xs text-muted-foreground">O pega una URL o elige una foto incluida en la tienda:</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {assetKeys.map((k) => (
                <button key={k} type="button" onClick={() => set("images", [...imgs, `asset:${k}`].join("\n"))} className="h-12 w-10 overflow-hidden border hover:border-foreground">
                  <img src={resolveImage(`asset:${k}`)} alt={k} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            {imgs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {imgs.map((u, i) => (
                  <div key={i} className="relative h-16 w-12">
                    <img src={resolveImage(u)} alt="" className="h-full w-full bg-cream object-cover" />
                    <button type="button" onClick={() => set("images", imgs.filter((_, j) => j !== i).join("\n"))} className="absolute -right-1 -top-1 bg-primary p-0.5 text-primary-foreground" aria-label="Quitar foto"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="col-span-2"><label className={label}>Descripción</label><textarea rows={3} className={input} value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
          <div className="col-span-2"><label className={label}>Detalles (uno por línea)</label><textarea rows={3} className={input} value={f.details} onChange={(e) => set("details", e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /> Visible en la tienda</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_demo} onChange={(e) => set("is_demo", e.target.checked)} /> Producto de demostración</label>
        </div>
        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 border py-3 text-xs font-bold uppercase">Cancelar</button>
          <button onClick={save} disabled={busy || uploading} className="flex-1 bg-primary py-3 text-xs font-bold uppercase text-primary-foreground disabled:opacity-50">{busy ? "Guardando…" : uploading ? "Subiendo…" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Pedidos ---------------- */

function Pedidos({ d }: { d: D }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const names = useMemo(() => new Map((d.profiles.data ?? []).map((p) => [p.id, p.full_name || "Sin nombre"])), [d.profiles.data]);
  const events = useQuery({
    queryKey: ["admin", "events", open],
    enabled: !!open,
    queryFn: async () => (await supabase.from("order_events").select("*").eq("order_id", open!).order("created_at", { ascending: false })).data ?? [],
  });
  const list = (d.orders.data ?? []).filter(
    (o) =>
      (!status || o.status === status) &&
      (!from || o.created_at >= from) &&
      ((names.get(o.user_id) ?? "") + o.id).toLowerCase().includes(q.toLowerCase()),
  );

  async function change(id: string, s: string) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("orders").update({ status: s }).eq("id", id);
    if (error) { toast.error("No se pudo cambiar el estado"); return; }
    await supabase.from("order_events").insert({ order_id: id, status: s, changed_by: u.user!.id });
    toast.success(`Pedido marcado como ${s}`);
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    qc.invalidateQueries({ queryKey: ["admin", "events"] });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente o número…" className="flex-1 border bg-background px-4 py-2.5 text-sm" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border bg-background px-4 py-2.5 text-sm">
          <option value="">Todos los estados</option>{STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border bg-background px-4 py-2.5 text-sm" title="Desde" />
      </div>
      <div className="mt-4 space-y-3">
        {list.length === 0 && <p className="border bg-background p-8 text-center text-muted-foreground">No hay pedidos con ese filtro.</p>}
        {list.map((o) => (
          <div key={o.id} className="border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className="text-left">
                <p className="font-bold">#{o.id.slice(0, 8).toUpperCase()} · {names.get(o.user_id) ?? "Cliente"}</p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("es-PE")} · {pen(Number(o.total))}</p>
              </button>
              <select value={o.status} onChange={(e) => change(o.id, e.target.value)} className="border px-3 py-2 text-sm capitalize">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {open === o.id && (
              <div className="mt-3 border-t pt-3 text-sm">
                <ul className="space-y-1">
                  {(o.items as Line[]).map((l, i) => <li key={i} className="flex justify-between"><span>{l.name} · Talla {l.size} x{l.qty}</span><span>{pen(l.price * l.qty)}</span></li>)}
                </ul>
                <p className="mt-3 text-xs font-bold uppercase text-muted-foreground">Historial de estados</p>
                {(events.data ?? []).length === 0 ? <p className="text-xs text-muted-foreground">Sin cambios registrados.</p> : (
                  <ul className="text-xs">{events.data!.map((e) => <li key={e.id}>{new Date(e.created_at).toLocaleString("es-PE")} → <b className="capitalize">{e.status}</b></li>)}</ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Clientes ---------------- */

function Clientes({ d }: { d: D }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const orders = d.orders.data ?? [];
  const list = (d.profiles.data ?? []).filter((p) => ((p.full_name ?? "") + (p.city ?? "") + (p.phone ?? "")).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, ciudad o teléfono…" className="w-full border bg-background px-4 py-2.5 text-sm" />
      <div className="mt-4 overflow-x-auto border bg-background">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Cliente</th><th>Teléfono</th><th>Ciudad</th><th>Registro</th><th>Pedidos</th></tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const mine = orders.filter((o) => o.user_id === p.id);
              return (
                <>
                  <tr key={p.id} onClick={() => setOpen(open === p.id ? null : p.id)} className="cursor-pointer border-b hover:bg-cream">
                    <td className="p-3 font-semibold">{p.full_name || "Sin nombre"}</td>
                    <td>{p.phone || "—"}</td>
                    <td>{p.city || "—"}</td>
                    <td>{new Date(p.created_at).toLocaleDateString("es-PE")}</td>
                    <td>{mine.length}</td>
                  </tr>
                  {open === p.id && (
                    <tr key={p.id + "-o"} className="border-b bg-cream/50">
                      <td colSpan={5} className="p-3">
                        {mine.length === 0 ? <p className="text-muted-foreground">Sin pedidos.</p> : (
                          <ul className="space-y-1">{mine.map((o) => <li key={o.id} className="flex justify-between"><span>#{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString("es-PE")}</span><span className="capitalize">{o.status} · {pen(Number(o.total))}</span></li>)}</ul>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
            {list.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No hay clientes.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
