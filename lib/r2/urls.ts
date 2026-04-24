/**
 * Helpers para generar URLs de Cloudflare R2.
 *
 * Layout del bucket:
 *   /original/Giocondas (N).png    — original sin modificar
 *   /medium/Giocondas (N).webp     — 1024px webp, para vista detail
 *   /thumb/Giocondas (N).webp      — 256px webp, para nube 3D / grids
 *
 * El dominio público `R2_PUBLIC_URL` apunta a Cloudflare CDN (cdn.infinitearebetterthanone.com).
 */
const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://cdn.infinitearebetterthanone.com";

export type ImageVariant = "original" | "medium" | "thumb";

export function giocondaUrl(filename: string, variant: ImageVariant = "medium") {
  // medium y thumb siempre webp; original conserva extensión
  if (variant === "original") {
    return `${R2_PUBLIC_URL}/original/${encodeURIComponent(filename)}`;
  }
  const base = filename.replace(/\.(png|jpe?g|webp)$/i, "");
  return `${R2_PUBLIC_URL}/${variant}/${encodeURIComponent(base)}.webp`;
}

export function giocondaSrcSet(filename: string) {
  const thumb = giocondaUrl(filename, "thumb");
  const medium = giocondaUrl(filename, "medium");
  return `${thumb} 256w, ${medium} 1024w`;
}
