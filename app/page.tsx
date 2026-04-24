import { LouvreScene } from "@/components/louvre/LouvreScene";
import { HeaderOverlay } from "@/components/ui/HeaderOverlay";
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

const SAMPLE_SIZE = 60;

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
    <main className="relative h-dvh w-full overflow-hidden">
      <LouvreScene giocondaUrls={urls} cycleDuration={60} />
      <HeaderOverlay />
    </main>
  );
}
