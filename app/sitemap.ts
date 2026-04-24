import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo/metadata";

export const revalidate = 86400; // 1 día

/**
 * Sitemap dinámico: todas las páginas estáticas + una entrada por Gioconda.
 * Google indexará cada una individualmente.
 *
 * Nota: Con 43k+ entradas, si supera los 50k (o 50MB) hay que fragmentar en
 * múltiples sitemaps. Por ahora cabe en uno solo.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("giocondas")
      .select("id, created_at")
      .order("id", { ascending: true })
      .limit(45000);

    const giocondaRoutes: MetadataRoute.Sitemap = (data ?? []).map((g) => ({
      url: `${SITE_URL}/giocondas/${g.id}`,
      lastModified: g.created_at ? new Date(g.created_at as string) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));

    return [...staticRoutes, ...giocondaRoutes];
  } catch {
    return staticRoutes;
  }
}
