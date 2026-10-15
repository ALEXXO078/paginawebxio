import zapatillas from "@/assets/zapatillas.jpg";
import zapatillas2 from "@/assets/zapatillas-2.jpg";
import botas from "@/assets/botas.jpg";
import botas2 from "@/assets/botas-2.jpg";
import casaca from "@/assets/casaca.jpg";
import casaca2 from "@/assets/casaca-2.jpg";
import vestido from "@/assets/vestido.jpg";
import vestido2 from "@/assets/vestido-2.jpg";
import chompa from "@/assets/chompa.jpg";
import sandalias from "@/assets/sandalias.jpg";
import blusa from "@/assets/blusa.jpg";
import gorra from "@/assets/gorra.jpg";
import reloj from "@/assets/reloj.jpg";
import perfume from "@/assets/perfume.jpg";
import pantalon from "@/assets/pantalon.jpg";

export type Product = {
  slug: string;
  name: string;
  category: string;
  sub?: string | undefined;
  price: number;
  old?: number | undefined;
  img: string;
  gallery: string[];
  rating?: number | undefined;
  reviews?: number | undefined;
  description: string;
  details: string[];
  sizes: { label: string; available: boolean }[];
  sizeType: "ropa" | "calzado";
  stock: number;
  isDemo: boolean;
};

export type ProductRow = {
  slug: string; name: string; category: string; sub: string | null; price: number; old_price: number | null;
  images: string[]; description: string; details: string[]; sizes: unknown; size_type: string;
  stock: number; active: boolean; is_demo: boolean; rating: number | null; reviews: number | null;
};

// Fotos incluidas en la tienda: en la base se guardan como "asset:nombre"
const assets: Record<string, string> = {
  zapatillas, "zapatillas-2": zapatillas2, botas, "botas-2": botas2, casaca, "casaca-2": casaca2,
  vestido, "vestido-2": vestido2, chompa, sandalias, blusa, gorra, reloj, perfume, pantalon,
};
export const assetKeys = Object.keys(assets);
export const resolveImage = (v: string) => (v.startsWith("asset:") ? assets[v.slice(6)] ?? "" : v);

export const rowToProduct = (r: ProductRow): Product => {
  const gallery = (r.images ?? []).map(resolveImage).filter(Boolean);
  const outOfStock = r.stock <= 0;
  const sizes = (Array.isArray(r.sizes) ? (r.sizes as { label: string; available: boolean }[]) : []).map((s) => ({
    label: String(s.label),
    available: !outOfStock && !!s.available,
  }));
  return {
    slug: r.slug, name: r.name, category: r.category, sub: r.sub ?? undefined,
    price: Number(r.price), old: r.old_price != null ? Number(r.old_price) : undefined,
    img: gallery[0] ?? "", gallery: gallery.length ? gallery : [""],
    rating: r.rating != null ? Number(r.rating) : undefined, reviews: r.reviews ?? undefined,
    description: r.description, details: r.details ?? [], sizes,
    sizeType: r.size_type === "calzado" ? "calzado" : "ropa",
    stock: r.stock, isDemo: r.is_demo,
  };
};

// Categorías donde la guía de medidas tiene sentido
const guideCategories = ["Ropa", "Zapatillas", "Botas", "Sandalias", "Pantalones", "Shorts", "Chaquetas"];
export const needsSizeGuide = (p: Product) =>
  guideCategories.includes(p.category) && p.sizes.some((s) => /^(XXS|XS|S|M|L|XL|XXL|\d{2})$/.test(s.label));

export const categories: { name: string; subs: string[] }[] = [
  { name: "Gorras", subs: [] },
  { name: "Relojes", subs: ["Casio", "Invicta"] },
  { name: "Zapatillas", subs: ["Nike", "Adidas", "Puma", "New Balance", "Vans", "Off-White"] },
  { name: "Pantalones", subs: ["Oversize", "Elegante", "Sport", "Baggy", "Buzos"] },
  { name: "Chaquetas", subs: [] },
  { name: "Perfumes", subs: ["Árabes", "De diseñador"] },
  { name: "Shorts", subs: ["Baggy", "Short", "Jorts"] },
  { name: "Accesorios", subs: ["Anillos", "Collares", "Aretes", "Pulseras", "Billeteras", "Lentes"] },
  { name: "Ofertas", subs: [] },
];

export const pen = (n: number) => `S/. ${n.toFixed(2)}`;

export const sizeGuideRopa = [
  { talla: "XS", busto: "80–84", cintura: "60–64", cadera: "86–90" },
  { talla: "S", busto: "84–88", cintura: "64–68", cadera: "90–94" },
  { talla: "M", busto: "88–94", cintura: "68–74", cadera: "94–100" },
  { talla: "L", busto: "94–100", cintura: "74–80", cadera: "100–106" },
  { talla: "XL", busto: "100–108", cintura: "80–88", cadera: "106–112" },
];

export const sizeGuideCalzado = [
  { talla: "35", cm: "22.5" },
  { talla: "36", cm: "23.0" },
  { talla: "37", cm: "23.5" },
  { talla: "38", cm: "24.0" },
  { talla: "39", cm: "25.0" },
  { talla: "40", cm: "25.5" },
  { talla: "41", cm: "26.0" },
  { talla: "42", cm: "26.5" },
];
