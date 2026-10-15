import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, Minus, Plus, Ruler, ShoppingBag, Star, Truck, RefreshCcw, X, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { pen, sizeGuideRopa, sizeGuideCalzado, needsSizeGuide } from "@/lib/products";
import { catalogQuery, useCatalog } from "@/lib/catalog";
import { cartStore } from "@/lib/cart";
import { waLink } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/producto/$slug")({
  loader: async ({ params, context }) => {
    const all = await context.queryClient.ensureQueryData(catalogQuery);
    const product = all.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.product.name} │ ADS Store` : "Producto │ ADS Store" },
      {
        name: "description",
        content: loaderData?.product.description ?? "Detalle de producto ADS Store.",
      },
      { property: "og:title", content: loaderData ? `${loaderData.product.name} │ ADS Store` : "Producto │ ADS Store" },
      { property: "og:description", content: loaderData?.product.description ?? "Detalle de producto ADS Store." },
    ],
  }),
  component: ProductPage,
  notFoundComponent: ProductNotFound,
});

function ProductNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="font-display text-4xl font-black uppercase">Producto no encontrado</h1>
      <p className="text-sm text-muted-foreground">El producto que buscas no existe o fue retirado.</p>
      <Link to="/" className="bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground">
        Volver a la tienda
      </Link>
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const loaded = Route.useLoaderData();
  const products = useCatalog();
  const product = products.find((p) => p.slug === slug) ?? loaded.product;
  const [photo, setPhoto] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [showGuide, setShowGuide] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const related = products.filter((p) => p.category === product.category && p.slug !== product.slug).slice(0, 4);
  const showGuide_ = needsSizeGuide(product);
  const labels = product.sizes.map((s) => s.label);
  const guide = (product.sizeType === "ropa" ? sizeGuideRopa : sizeGuideCalzado).filter((r) => labels.includes(r.talla));

  const addToCart = () => {
    if (!size) {
      setSizeError(true);
      toast.error("Elige una talla primero", { description: "Selecciona tu talla para agregar al carrito." });
      return;
    }
    cartStore.add(product.slug, size, qty);
    toast.success("Agregado al carrito", { description: `${product.name} · Talla ${size} · Cant. ${qty}` });
  };

  const waMessage = [
    `Hola, estoy interesado en el producto ${product.name} de ADS Store.`,
    `Código: ${product.slug}`,
    size ? `Talla: ${size} · Cantidad: ${qty}` : null,
    `Precio: ${pen(product.price)}`,
    typeof window !== "undefined" ? `Enlace: ${window.location.origin}/producto/${product.slug}` : null,
    size ? "¿Está disponible?" : "¿Podrían brindarme más información sobre el precio, las tallas disponibles y el stock?",
  ].filter(Boolean).join("\n");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Inicio</Link>
          <ChevronRight className="h-3 w-3" />
          <span>{product.category}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          {/* Galería */}
          <div>
            <div className="relative aspect-[3/4] overflow-hidden bg-cream">
              <img
                src={product.gallery[photo]}
                alt={product.name}
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
              {product.old && (
                <span className="absolute left-4 top-4 bg-sale px-2 py-1 text-xs font-bold text-sale-foreground">
                  -{Math.round((1 - product.price / product.old) * 100)}%
                </span>
              )}
            </div>
            {product.gallery.length > 1 && (
              <div className="mt-3 flex gap-3">
                {product.gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setPhoto(i)}
                    aria-label={`Foto ${i + 1}`}
                    className={`aspect-square w-20 overflow-hidden border-2 transition-colors ${
                      photo === i ? "border-foreground" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={g} alt="" loading="lazy" width={1024} height={1024} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight md:text-4xl">{product.name}</h1>
            {product.rating && (
              <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                {product.rating.toFixed(1)} / 5.0 · {product.reviews} {product.reviews === 1 ? "testimonio" : "testimonios"}
              </div>
            )}
            <div className="mt-4 flex items-baseline gap-3">
              <span className={`text-2xl font-bold ${product.old ? "text-sale" : ""}`}>{pen(product.price)}</span>
              {product.old && <span className="text-lg text-muted-foreground line-through">{pen(product.old)}</span>}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Tallas */}
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <span className={`text-sm font-bold uppercase ${sizeError && !size ? "text-sale" : ""}`}>
                  {sizeError && !size ? "Elige tu talla" : "Talla"}
                </span>
                {showGuide_ && <button
                  onClick={() => setShowGuide(true)}
                  className="flex items-center gap-1 text-xs font-semibold underline underline-offset-4 hover:opacity-70"
                >
                  <Ruler className="h-3.5 w-3.5" /> Guía de medidas
                </button>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.label}
                    disabled={!s.available}
                    onClick={() => {
                      setSize(s.label);
                      setSizeError(false);
                    }}
                    className={`min-w-12 border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      !s.available
                        ? "cursor-not-allowed border-border text-muted-foreground/40 line-through"
                        : size === s.label
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad + agregar */}
            <div className="mt-6 flex gap-3">
              <div className="flex items-center border border-border">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-3" aria-label="Menos">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="px-3 py-3" aria-label="Más">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={addToCart}
                className="flex flex-1 items-center justify-center gap-2 bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
              >
                <ShoppingBag className="h-4 w-4" /> Agregar al carrito
              </button>
            </div>
            <a
              href={waLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 border border-foreground py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background"
            >
              <MessageCircle className="h-4 w-4" /> Comprar por WhatsApp
            </a>

            {/* Beneficios */}
            <div className="mt-8 space-y-3 border-t pt-6 text-sm">
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 shrink-0" />
                <span>Envío a todo el Perú · Lima S/9.90 · Provincia S/14.90</span>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCcw className="h-4 w-4 shrink-0" />
                <span>Cambios fáciles hasta 7 días de recibido</span>
              </div>
            </div>

            {/* Detalles */}
            <div className="mt-8 border-t pt-6">
              <h2 className="text-sm font-bold uppercase">Detalles</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {product.details.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Relacionados */}
        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-8 font-display text-3xl font-black uppercase tracking-tight">También te puede gustar</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
              {related.map((p) => (
                <Link key={p.slug} to="/producto/$slug" params={{ slug: p.slug }} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden bg-cream">
                    <img
                      src={p.img}
                      alt={p.name}
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{p.name}</h3>
                  <span className="text-sm font-bold">{pen(p.price)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-16">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
            <ArrowLeft className="h-4 w-4" /> Seguir comprando
          </Link>
        </div>
      </main>

      {/* Modal guía de medidas */}
      {showGuide && showGuide_ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4" onClick={() => setShowGuide(false)}>
          <div className="w-full max-w-md bg-background p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-black uppercase">Guía de medidas</h3>
              <button onClick={() => setShowGuide(false)} aria-label="Cerrar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Talla</th>
                  {product.sizeType === "ropa" ? (
                    <>
                      <th className="py-2">Busto (cm)</th>
                      <th className="py-2">Cintura (cm)</th>
                      <th className="py-2">Cadera (cm)</th>
                    </>
                  ) : (
                    <th className="py-2">Largo del pie (cm)</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {guide.map((row) => (
                  <tr key={row.talla} className="border-b last:border-0">
                    <td className="py-2 font-bold">{row.talla}</td>
                    {"busto" in row ? (
                      <>
                        <td className="py-2">{row.busto}</td>
                        <td className="py-2">{row.cintura}</td>
                        <td className="py-2">{row.cadera}</td>
                      </>
                    ) : (
                      <td className="py-2">{"cm" in row ? row.cm : ""}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-muted-foreground">
              Mide tu cuerpo sin apretar la cinta. Si estás entre dos tallas, te recomendamos la mayor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
