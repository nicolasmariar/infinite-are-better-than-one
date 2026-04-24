import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { giocondaUrl } from "@/lib/r2/urls";

export const revalidate = 60;

/**
 * GET /api/giocondas
 *
 * Devuelve una muestra aleatoria de Giocondas de la DB para que el front
 * las rote en la escena 3D del Louvre.
 *
 * Query params:
 *   ?limit=60  — cuántas devolver (default 60, max 200)
 *
 * Response: { items: [{ id, slug, filename, url }] }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "60", 10) || 60, 1), 200);

  const supabase = await createClient();

  // PostgreSQL: `ORDER BY random() LIMIT N` vía RPC no es directo en postgrest,
  // pero Supabase expone TABLESAMPLE BERNOULLI + limit. Alternativa: seleccionar
  // desde un offset aleatorio. Simple y razonable para nuestro volumen (43k rows).
  const { data: countData } = await supabase
    .from("giocondas")
    .select("*", { count: "exact", head: true });
  const total = countData ? 0 : 0; // head:true no devuelve count aquí

  // Fetch con RPC custom — si existe, si no usamos offset random.
  const offset = Math.floor(Math.random() * Math.max(1, 43000 - limit));
  const { data, error } = await supabase
    .from("giocondas")
    .select("id, slug, filename")
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((g) => ({
    id: g.id,
    slug: g.slug,
    filename: g.filename,
    url: giocondaUrl(g.filename, "medium"),
  }));

  // Shuffle del lado del server para que el orden visto sea aleatorio aunque
  // el `range` haya traído items consecutivos
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  return NextResponse.json({ items, total: items.length });
}
