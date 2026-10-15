import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { z } from "zod";
import { pen, categories } from "@/lib/products";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { buildProductWhatsAppLink } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";

const search = z.object({
  q: z.string().optional().catch(undefined),
  cat: z.string().optional().catch(undefined),
  sub: z.string().optional().catch(undefined),
  sort: z.enum(["nuevo", "precio-asc", "precio-desc", "sale"]).optional().catch(undefined),
});

export const Route = createFileRoute("/tienda")({
  validateSearch: search,
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "Tienda │ Ropa, calzado y más – ADS Store" },
      { name: "description", content: "Busca, filtra y ordena toda la colección de ADS Store: gorras, relojes, zapatillas, pantalones, perfumes y más." },
      { property: "og:title", content: "Tienda ADS Store" },
      { property: "og:description", content: "Toda la colección ADS Store en un solo lugar." },
    ],
  }),
  component: Tienda,
});

const cats = ["Todo", ...categories.map((c) => c.name)];

function ProductWhatsAppButton({ product }: { product: { name: string; slug: string; price: number; old?: number | null } }) {
  const href = buildProductWhatsAppLink({
    productName: product.name,
    slug: product.slug,
    price: product.price,
    url: typeof window !== "undefined" ? `${window.location.origin}/producto/${product.slug}` : undefined,
  });

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 border border-foreground px-2 py-2 text-[10px] font-bold uppercase tracking-wide transition-colors hover:bg-foreground hover:text-background"
      onClick={(event) => event.stopPropagation()}
    >
      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
    </a>
  );
}

function Tienda() {
  const products = useCatalog();
  const { q = "", cat: rawCat = "Todo", sub, sort = "nuevo" } = Route.useSearch();
  const cat = rawCat === "Sale" ? "Ofertas" : rawCat;
  const subs = categories.find((c) => c.name === cat)?.subs ?? [];
  const navigate = useNavigate({ from: "/tienda" });
  const set = (p: Partial<{ q: string; cat: string; sub: string; sort: string }>) =>
    navigate({ search: (s) => ({ ...s, ...p }) as never, replace: true });

  let list = products.filter((p) => {
    if (cat === "Ofertas") return !!p.old && p.old > p.price;
    if (cat !== "Todo" && p.category !== cat) return false;
    if (sub && p.sub !== sub) return false;
    return true;
  });
  if (q) list = list.filter((p) => (p.name + p.category + p.description).toLowerCase().includes(q.toLowerCase()));
  if (sort === "precio-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "precio-desc") list = [...list].sort((a, b) => b.price - a.price);
  if (sort === "sale") list = [...list].sort((a, b) => Number(!!b.old) - Number(!!a.old));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-5xl font-black uppercase">{cat === "Todo" ? "Tienda" : cat}</h1>
        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <input
            value={q}
            onChange={(e) => set({ q: e.target.value || undefined } as never)}
            placeholder="Buscar productos…"
            className="flex-1 border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            autoFocus={!!q}
          />
          <select value={sort} onChange={(e) => set({ sort: e.target.value })} className="border bg-background px-4 py-3 text-sm">
            <option value="nuevo">Más nuevos</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="sale">Ofertas primero</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => set({ cat: c === "Todo" ? undefined : c, sub: undefined } as never)}
              className={`border px-4 py-2 text-xs font-bold uppercase tracking-wide ${c === cat ? "bg-primary text-primary-foreground" : "hover:bg-cream"}`}
            >
              {c}
            </button>
          ))}
        </div>
        {subs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {["Todos", ...subs].map((s) => {
              const active = s === "Todos" ? !sub : s === sub;
              return (
                <button key={s} onClick={() => set({ sub: s === "Todos" ? undefined : s } as never)} className={`border-b-2 px-2 py-1 text-xs font-semibold ${active ? "border-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-6 text-sm text-muted-foreground">{list.length} producto{list.length === 1 ? "" : "s"}</p>
        {list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold">{cat === "Ofertas" ? "Actualmente no hay ofertas disponibles" : "Aún no hay productos aquí"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{cat === "Ofertas" ? "Vuelve pronto para ver nuevas promociones." : "Pronto agregaremos productos. Prueba con otra búsqueda o categoría."}</p>
            <button onClick={() => navigate({ search: {} as never })} className="mt-4 underline">Limpiar filtros</button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {list.map((p) => (
              <div key={p.slug} className="group">
                <Link to="/producto/$slug" params={{ slug: p.slug }}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                    <img src={p.img} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    {p.old && <span className="absolute left-3 top-3 bg-sale px-2 py-1 text-xs font-bold text-sale-foreground">-{Math.round((1 - p.price / p.old) * 100)}%</span>}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{p.name}</h3>
                  <div className="mt-1 flex gap-2 text-sm">
                    <span className={p.old ? "font-bold text-sale" : "font-bold"}>{pen(p.price)}</span>
                    {p.old && <span className="text-muted-foreground line-through">{pen(p.old)}</span>}
                  </div>
                </Link>
                <div className="mt-3">
                  <ProductWhatsAppButton product={p} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
