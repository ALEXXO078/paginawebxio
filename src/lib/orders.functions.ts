import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  items: z
    .array(z.object({ slug: z.string().max(100), size: z.string().max(20), qty: z.number().int().min(1).max(10) }))
    .min(1)
    .max(50),
});

// Registra el pedido recalculando precios y stock en el servidor
export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const slugs = [...new Set(data.items.map((i) => i.slug))];
    const { data: rows, error: pErr } = await supabaseAdmin.from("products").select("*").in("slug", slugs).eq("active", true);
    if (pErr) throw new Error("No se pudo validar el stock");

    const need = new Map<string, number>();
    const lines = data.items.map((i) => {
      const p = rows?.find((r) => r.slug === i.slug);
      if (!p) throw new Error(`Producto no disponible: ${i.slug}`);
      const sizes = (p.sizes as { label: string; available: boolean }[]) ?? [];
      const s = sizes.find((x) => x.label === i.size);
      if (!s?.available) throw new Error(`${p.name} talla ${i.size} está agotado`);
      need.set(p.slug, (need.get(p.slug) ?? 0) + i.qty);
      return { slug: p.slug, name: p.name, size: i.size, qty: i.qty, price: Number(p.price) };
    });
    for (const [slug, qty] of need) {
      const p = rows!.find((r) => r.slug === slug)!;
      if (p.stock < qty) throw new Error(`Solo quedan ${p.stock} unidades de ${p.name}`);
    }

    const total = Math.round(lines.reduce((a, l) => a + l.price * l.qty, 0) * 100) / 100;
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .insert({ user_id: context.userId, total, items: lines })
      .select("id")
      .single();
    if (error) throw new Error("No se pudo registrar el pedido");

    for (const [slug, qty] of need) {
      const p = rows!.find((r) => r.slug === slug)!;
      await supabaseAdmin.from("products").update({ stock: Math.max(0, p.stock - qty) }).eq("slug", slug);
    }
    return { id: row.id, total, lines };
  });
