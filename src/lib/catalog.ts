import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { getCatalog } from "@/lib/catalog.functions";
import { rowToProduct, type Product, type ProductRow } from "@/lib/products";

export const catalogQuery = queryOptions({
  queryKey: ["catalog"],
  queryFn: async () => ((await getCatalog()) as unknown as ProductRow[]).map(rowToProduct),
  staleTime: 60_000,
});

// Para páginas con loader (portada, tienda, producto)
export const useCatalog = () => useSuspenseQuery(catalogQuery).data;

// Para lugares sin loader (carrito, cuenta)
export function useCatalogLazy() {
  const { data } = useQuery(catalogQuery);
  const list: Product[] = data ?? [];
  return { list, get: (slug: string) => list.find((p) => p.slug === slug), loading: !data };
}
