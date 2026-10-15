import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { useCartCount } from "@/lib/cart";
import { useUser } from "@/lib/auth";
import { categories } from "@/lib/products";

const nav = [
  { l: "Nuevo", cat: undefined as string | undefined },
  ...categories.map((c) => ({ l: c.name, cat: c.name as string | undefined })),
];

export function SiteHeader() {
  const cart = useCartCount();
  const { user } = useUser();
  const [menu, setMenu] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <button className="lg:hidden" onClick={() => setMenu(true)} aria-label="Menú">
            <Menu className="h-5 w-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 font-display text-2xl font-black tracking-tight">
            {/* Espacio para el logo: reemplazar este cuadro por <img src={logo} /> */}
            <span aria-hidden className="flex h-8 w-8 items-center justify-center bg-primary text-xs text-primary-foreground">ADS</span>
            ADS Store
          </Link>
          <nav className="hidden gap-5 text-xs font-semibold uppercase tracking-wide lg:flex">
            {nav.map((n) => (
              <Link key={n.l} to="/tienda" search={{ cat: n.cat }} className={n.l === "Ofertas" ? "text-sale" : "transition-opacity hover:opacity-60"}>
                {n.l}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button aria-label="Buscar" onClick={() => setSearching((s) => !s)}>
              <Search className="h-5 w-5" />
            </button>
            <Link to={user ? "/cuenta" : "/auth"} aria-label={user ? "Mi cuenta" : "Ingresar"} className="flex items-center gap-1 text-xs font-semibold">
              <User className="h-5 w-5" />
              <span className="hidden lg:inline">{user ? "Mi cuenta" : "Ingresar"}</span>
            </Link>
            <Link to="/carrito" className="relative" aria-label="Carrito">
              <ShoppingBag className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cart}
              </span>
            </Link>
          </div>
        </div>
        {searching && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearching(false);
              navigate({ to: "/tienda", search: { q: q.trim() || undefined } });
            }}
            className="mx-auto max-w-7xl px-4 pb-3"
          >
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué estás buscando?" className="w-full border bg-background px-4 py-3 text-sm outline-none focus:border-foreground" />
          </form>
        )}
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background p-6 lg:hidden">
          <button onClick={() => setMenu(false)} aria-label="Cerrar">
            <X className="h-6 w-6" />
          </button>
          <nav className="mt-8 flex flex-col gap-4 font-display text-2xl font-black uppercase">
            {nav.map((n) => (
              <Link key={n.l} to="/tienda" search={{ cat: n.cat }} onClick={() => setMenu(false)}>
                {n.l}
              </Link>
            ))}
            <Link to={user ? "/cuenta" : "/auth"} onClick={() => setMenu(false)}>
              {user ? "Mi cuenta" : "Ingresar"}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}
