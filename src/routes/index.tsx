import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, Truck, Store, RefreshCcw, CreditCard } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero.jpg";
import zapatillas from "@/assets/zapatillas.jpg";
import casaca from "@/assets/casaca.jpg";
import gorra from "@/assets/gorra.jpg";
import reloj from "@/assets/reloj.jpg";
import perfume from "@/assets/perfume.jpg";
import pantalon from "@/assets/pantalon.jpg";
import chompa from "@/assets/chompa.jpg";
import { pen } from "@/lib/products";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { cartStore } from "@/lib/cart";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  head: () => ({
    meta: [
      { title: "ADS Store │ Gorras, Relojes, Zapatillas, Perfumes y más" },
      { name: "description", content: "Gorras, relojes, zapatillas, pantalones, perfumes y accesorios. Envíos a todo el Perú." },
      { property: "og:title", content: "ADS Store │ Gorras, Relojes, Zapatillas, Perfumes y más" },
      { property: "og:description", content: "Gorras, relojes, zapatillas, pantalones, perfumes y accesorios. Envíos a todo el Perú." },
    ],
  }),
  component: Index,
});

const categories = [
  { name: "Gorras", img: gorra },
  { name: "Relojes", img: reloj },
  { name: "Zapatillas", img: zapatillas },
  { name: "Pantalones", img: pantalon },
  { name: "Chaquetas", img: casaca },
  { name: "Perfumes", img: perfume },
  { name: "Shorts", img: pantalon },
  { name: "Accesorios", img: reloj },
  { name: "Ofertas", img: chompa },
];

function Index() {
  const products = useCatalog();
  return (
    <div className="min-h-screen bg-background">
      {/* Barra de anuncios */}
      <div className="overflow-hidden bg-primary py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground">
        <div className="animate-marquee flex w-max gap-16 whitespace-nowrap">
          {Array.from({ length: 2 }).flatMap((_, i) =>
            ["Envío gratis por recojo en tienda", "Hasta 25% OFF en casacas y abrigos", "Envío express en Lima el mismo día", "Paga con todas las tarjetas"].map((t) => (
              <span key={t + i}>✦ {t}</span>
            )),
          )}
        </div>
      </div>

      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        <img src={hero} alt="Nueva colección ADS Store" width={1920} height={1024} className="h-[70vh] w-full object-cover md:h-[85vh]" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/40 to-transparent">
          <div className="mx-auto w-full max-w-7xl px-4 pb-12">
            <h1 className="font-display text-5xl font-black uppercase tracking-tight text-primary-foreground md:text-7xl">
              Nueva colección
            </h1>
            <p className="mt-2 max-w-md text-sm font-medium text-primary-foreground/90">
              Lo último en ropa, calzado y accesorios. Envíos a todo el Perú.
            </p>
            <a
              href="#coleccion"
              className="mt-6 inline-block bg-primary-foreground px-8 py-3 text-xs font-bold uppercase tracking-widest text-primary transition-opacity hover:opacity-90"
            >
              Comprar ahora
            </a>
          </div>
        </div>
      </section>

      {/* Nueva colección */}
      <section id="coleccion" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="font-display text-4xl font-black uppercase tracking-tight md:text-5xl">Nueva colección</h2>
          <a href="#coleccion" className="text-sm font-semibold underline underline-offset-4">Ver todo</a>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {products.map((p) => (
            <article key={p.slug} className="group">
              <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                <Link to="/producto/$slug" params={{ slug: p.slug }} aria-label={`Ver ${p.name}`}>
                  <img src={p.img} alt={p.name} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </Link>
                {p.old && (
                  <span className="absolute left-3 top-3 bg-sale px-2 py-1 text-xs font-bold text-sale-foreground">
                    -{Math.round((1 - p.price / p.old) * 100)}%
                  </span>
                )}
                <div className="absolute inset-x-3 bottom-3 flex translate-y-2 gap-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <Link
                    to="/producto/$slug"
                    params={{ slug: p.slug }}
                    className="flex-1 bg-background py-3 text-center text-xs font-bold uppercase tracking-widest text-foreground"
                  >
                    Ver detalle
                  </Link>
                  <button
                    onClick={() => {
                      const first = p.sizes.find((s) => s.available);
                      cartStore.add(p.slug, first?.label ?? "Única");
                      toast.success("Agregado al carrito", { description: `${p.name} · Talla ${first?.label ?? "única"}` });
                    }}
                    className="flex-1 bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground"
                  >
                    Agregar
                  </button>
                </div>
              </div>
              <Link to="/producto/$slug" params={{ slug: p.slug }}>
                <h3 className="mt-3 text-sm font-semibold hover:underline">{p.name}</h3>
              </Link>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className={p.old ? "font-bold text-sale" : "font-bold"}>{pen(p.price)} PEN</span>
                {p.old && <span className="text-muted-foreground line-through">{pen(p.old)}</span>}
              </div>
              {p.rating && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3 fill-foreground text-foreground" />
                  {p.rating.toFixed(1)} / 5.0 · {p.reviews} {p.reviews === 1 ? "testimonio" : "testimonios"}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="mb-10 font-display text-4xl font-black uppercase tracking-tight md:text-5xl">Compra por categoría</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.name} to="/tienda" search={{ cat: c.name }} className="group relative aspect-square overflow-hidden bg-cream">
              <img src={c.img} alt={c.name} loading="lazy" width={1024} height={1024} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute bottom-4 left-4 bg-background px-4 py-2 font-display text-sm font-black uppercase">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-y bg-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
          {[
            { i: Truck, t: "Envío a todo Perú", d: "Lima S/9.90 · Provincia S/14.90" },
            { i: Store, t: "Recojo gratis", d: "En cualquiera de nuestras tiendas" },
            { i: RefreshCcw, t: "Cambios fáciles", d: "Hasta 7 días de recibido" },
            { i: CreditCard, t: "Pago seguro", d: "Todas las tarjetas y más" },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="flex flex-col items-center text-center">
              <Icon className="mb-3 h-7 w-7" />
              <h4 className="text-sm font-bold uppercase">{t}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-display text-4xl font-black uppercase">Únete a ADS Store</h2>
          <p className="mt-3 text-sm opacity-70">Recibe novedades, lanzamientos y descuentos exclusivos.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("¡Gracias por suscribirte!", { description: "Pronto recibirás nuestras novedades." });
            }}
            className="mx-auto mt-8 flex max-w-md"
          >
            <input type="email" required placeholder="Tu correo electrónico" className="flex-1 border border-primary-foreground/30 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-primary-foreground/50" />
            <button className="bg-primary-foreground px-6 text-xs font-bold uppercase tracking-widest text-primary">Suscribirme</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto grid max-w-7xl gap-10 px-4 py-14 text-sm md:grid-cols-4">
        <div>
          <div className="font-display text-3xl font-black tracking-tighter">ADS Store</div>
          <p className="mt-3 text-muted-foreground">Tienda de ropa, calzado y accesorios. 🇵🇪 Hecho para Perú.</p>
        </div>
        {[
          { h: "Tienda", l: ["Nuevo", "Zapatillas", "Perfumes", "Ofertas"] },
          { h: "Ayuda", l: ["Envíos", "Cambios y devoluciones", "Guía de tallas", "Libro de reclamaciones"] },
          { h: "ADS Store", l: ["Nuestras tiendas", "Nosotros", "Contacto", "Instagram"] },
        ].map((c) => (
          <div key={c.h}>
            <h5 className="mb-3 font-bold uppercase">{c.h}</h5>
            <ul className="space-y-2 text-muted-foreground">
              {c.l.map((x) => <li key={x}><a href="#" className="hover:text-foreground">{x}</a></li>)}
            </ul>
          </div>
        ))}
      </footer>
      <div className="border-t py-6 text-center text-xs text-muted-foreground">© 2026 ADS Store. Todos los derechos reservados.</div>
    </div>
  );
}
