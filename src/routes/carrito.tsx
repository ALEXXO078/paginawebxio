import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cartStore, useCart } from "@/lib/cart";
import { pen } from "@/lib/products";
import { useCatalogLazy } from "@/lib/catalog";
import { useUser } from "@/lib/auth";
import { createOrder } from "@/lib/orders.functions";
import { waLink } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/carrito")({
  head: () => ({
    meta: [
      { title: "Tu carrito │ ADS Store" },
      { name: "description", content: "Revisa tus productos y finaliza tu compra por WhatsApp." },
      { property: "og:title", content: "Carrito │ ADS Store" },
      { property: "og:description", content: "Tu carrito de compras ADS Store." },
    ],
  }),
  component: Carrito,
});

function Carrito() {
  const items = useCart();
  const { get: getProduct } = useCatalogLazy();
  const { user } = useUser();
  const order = useServerFn(createOrder);
  const [busy, setBusy] = useState(false);

  const lines = items
    .map((i) => ({ ...i, p: getProduct(i.slug) }))
    .filter((l): l is typeof l & { p: NonNullable<typeof l.p> } => !!l.p);
  const total = lines.reduce((a, l) => a + l.p.price * l.qty, 0);

  async function checkout() {
    setBusy(true);
    try {
      let header = "¡Hola ADS Store! Quiero comprar estos productos:";
      if (user) {
        const r = await order({ data: { items: lines.map(({ slug, size, qty }) => ({ slug, size, qty })) } });
        header = `¡Hola ADS Store! Pedido #${r.id.slice(0, 8).toUpperCase()}:`;
      }
      const body = lines.map((l) => `• ${l.p.name} – Talla ${l.size} x${l.qty} – ${pen(l.p.price * l.qty)}`).join("\n");
      const msg = `${header}\n${body}\n\nTotal: ${pen(total)}\n¿Está disponible?`;
      window.open(waLink(msg), "_blank");
      if (user) {
        cartStore.clear();
        toast.success("Pedido registrado", { description: "Puedes verlo en Mi cuenta." });
      }
    } catch (e) {
      toast.error((e as Error).message || "No se pudo procesar el pedido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-5xl font-black uppercase">Carrito</h1>
        {lines.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold">Tu carrito está vacío</p>
            <Link to="/tienda" className="mt-4 inline-block bg-primary px-8 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground">Ir a la tienda</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
            <ul className="divide-y border-y">
              {lines.map((l) => (
                <li key={l.slug + l.size} className="flex gap-4 py-4">
                  <Link to="/producto/$slug" params={{ slug: l.slug }}>
                    <img src={l.p.img} alt={l.p.name} className="h-28 w-24 object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <Link to="/producto/$slug" params={{ slug: l.slug }} className="font-semibold hover:underline">{l.p.name}</Link>
                      <button aria-label="Eliminar" onClick={() => { cartStore.remove(l.slug, l.size); toast("Producto eliminado"); }}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">Talla {l.size} · {pen(l.p.price)}</span>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center border">
                        <button aria-label="Menos" className="p-2" onClick={() => cartStore.setQty(l.slug, l.size, l.qty - 1)}><Minus className="h-3 w-3" /></button>
                        <span className="w-8 text-center text-sm">{l.qty}</span>
                        <button aria-label="Más" className="p-2" onClick={() => cartStore.setQty(l.slug, l.size, l.qty + 1)}><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="font-bold">{pen(l.p.price * l.qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <aside className="h-fit bg-cream p-6">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{pen(total)}</span></div>
              <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold"><span>Total</span><span>{pen(total)}</span></div>
              <button disabled={busy} onClick={checkout} className="mt-6 w-full bg-primary py-4 text-xs font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50">
                {busy ? "Procesando…" : "Comprar por WhatsApp"}
              </button>
              {!user && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <Link to="/auth" className="underline">Inicia sesión</Link> para guardar tu pedido en tu historial.
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
