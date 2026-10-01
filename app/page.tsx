import { LouvreSceneLazy } from "@/components/louvre/LouvreSceneLazy";
import { HeaderOverlay } from "@/components/ui/HeaderOverlay";
import { SeoContent } from "@/components/ui/SeoContent";
import { createClient } from "@/lib/supabase/server";
import { giocondaUrl } from "@/lib/r2/urls";

// Fallback local si Supabase/R2 no responden (20 Giocondas locales)
const FALLBACK_SAMPLES = [
  "Giocondas (10831).png",
  "Giocondas (11960).jpg",
  "Giocondas (14045).jpg",
  "Giocondas (18599).png",
  "Giocondas (19711).png",
  "Giocondas (21049).png",
  "Giocondas (23112).png",
  "Giocondas (24205).jpg",
  "Giocondas (29588).png",
  "Giocondas (32352).png",
  "Giocondas (33821).jpg",
  "Giocondas (34240).png",
  "Giocondas (36880).png",
  "Giocondas (37900).png",
  "Giocondas (38997).jpg",
  "Giocondas (39844).png",
  "Giocondas (40085).jpg",
  "Giocondas (42037).jpg",
  "Giocondas (42079).jpg",
  "Giocondas (9362).jpg",
].map((f) => `/giocondas-sample/${encodeURIComponent(f)}`);

// 12 es suficiente para la rotación (current + next + buffer). Más URLs en
// el HTML inicial solo inflan la payload sin beneficio inmediato.
const SAMPLE_SIZE = 12;

export const revalidate = 300; // ISR cada 5 min — rota el sample mostrado

async function getGiocondaUrls(): Promise<string[]> {
  try {
    const supabase = await createClient();
    const offset = Math.floor(Math.random() * Math.max(1, 43000 - SAMPLE_SIZE));
    const { data, error } = await supabase
      .from("giocondas")
      .select("filename")
      .range(offset, offset + SAMPLE_SIZE - 1);
    if (error || !data || data.length === 0) return FALLBACK_SAMPLES;
    const urls = data.map((g) => giocondaUrl(g.filename, "medium"));
    // shuffle
    for (let i = urls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [urls[i], urls[j]] = [urls[j], urls[i]];
    }
    return urls;
  } catch {
    return FALLBACK_SAMPLES;
  }
}

export default async function HomePage() {
  const urls = await getGiocondaUrls();
  return (
    <>
      {/* Hero fixed 100vh: escena 3D como experiencia primaria.
          `overflow-hidden` se quitó del <main> para permitir scroll a la
          sección SEO. El LouvreScene usa `fixed inset-0` internamente, así
          que se queda de fondo mientras se hace scroll. */}
      <main className="relative h-dvh w-full">
        <LouvreSceneLazy giocondaUrls={urls} cycleDuration={60} />
        <HeaderOverlay />

        {/* Indicador discreto de scroll — le avisa al usuario que hay más
            contenido abajo. Solo visible en desktop para no tapar touch. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 hidden justify-center sm:flex">
          <div className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-neutral-500/70">
            <span>scroll</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </main>

      {/* Sección SEO-rich debajo del hero. Usa `bg-[#0a0d13]` para cortar
          visualmente con el canvas fijo de arriba. Contiene el H1 semántico,
          H2s con keywords, texto bilingüe y enlaces internos. */}
      <div className="relative z-10 bg-[#0a0d13]">
        <SeoContent />
      </div>
    </>
  );
}
