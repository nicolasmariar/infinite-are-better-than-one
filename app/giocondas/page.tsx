import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Las 43.469 Giocondas IA — dataset completo",
  description:
    "Dataset completo de 43.469 Giocondas generadas con IA por 12 modelos entrenados en artistas argentinos: Quinquela, Xul Solar, Berni, Forner, Le Parc, Minujín y más. Arte argentino con inteligencia artificial.",
  alternates: {
    canonical: `${SITE_URL}/giocondas`,
    languages: {
      "es-AR": `${SITE_URL}/giocondas`,
      "es": `${SITE_URL}/giocondas`,
      "en": `${SITE_URL}/giocondas`,
      "x-default": `${SITE_URL}/giocondas`,
    },
  },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/giocondas`,
    locale: "es_AR",
    alternateLocale: ["en_US"],
    title: "Las 43.469 Giocondas IA — dataset completo | Infinite are better than one",
    description:
      "Explorá las 43.469 Giocondas generadas con inteligencia artificial por Nicolás Ruarte. Modelos entrenados en artistas argentinos. Finalista Premio Pueyrredón 2025.",
  },
};

export default async function GiocondasIndex() {
  const supabase = await createClient();
  const { data: styles } = await supabase
    .from("styles")
    .select("name, artist_full_name, artist_slug")
    .order("name");

  const { count } = await supabase
    .from("giocondas")
    .select("*", { count: "exact", head: true });

  return (
    <main className="min-h-dvh bg-[#0a0d13] text-neutral-100">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8 sm:py-24">
        {/* Breadcrumbs visibles */}
        <nav aria-label="Breadcrumb" className="text-xs text-neutral-500">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-neutral-300">
                Home
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-neutral-400">All Giocondas</li>
          </ol>
        </nav>
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-neutral-400 hover:text-neutral-200"
        >
          ← volver al Louvre virtual · back to the Louvre
        </Link>
        <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">
          Las {count?.toLocaleString("es-AR")} Giocondas IA
        </h1>
        <p className="mt-2 font-serif text-xl italic text-neutral-500">
          All {count?.toLocaleString("en-US")} AI-generated Mona Lisas
        </p>
        <p className="mt-6 max-w-2xl text-neutral-300">
          Una constelación de <strong>Giocondas generadas con inteligencia
          artificial</strong> por 12 modelos LoRA entrenados individualmente
          por <strong>Nicolás Ruarte</strong> sobre la obra de grandes{" "}
          <strong>artistas argentinos</strong>.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-neutral-400">
          A constellation of Mona Lisas reimagined by 12 open-source AI models
          independently trained on works of Argentine masters. Each image is a
          unique Gioconda generated with Stable Diffusion + LoRA.
        </p>

        <section className="mt-12">
          <h2 className="font-serif text-lg text-neutral-200">
            Estilos (LoRAs) en el dataset
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Styles (LoRAs) in the dataset
          </p>
          <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {(styles ?? []).map((s) => (
              <li key={s.name} className="rounded-md border border-neutral-800/60 bg-neutral-900/40 px-4 py-3">
                <div className="font-medium text-neutral-100">
                  {s.artist_full_name ?? s.name}
                </div>
                <div className="mt-0.5 font-mono text-xs text-neutral-500">{s.name}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-6 text-sm leading-relaxed text-neutral-300">
          <h2 className="font-serif text-lg text-neutral-100">3D cloud map — coming soon</h2>
          <p className="mt-2">
            Each Gioconda will be placed in a 3D space using a gravitational layout
            derived from its LoRA weight vector. Pure styles cluster near their
            style anchor; mixed styles drift between them — a visual
            representation of the hybridization of cultural identities.
          </p>
          <p className="mt-2">
            The installation will also incorporate a live generator producing new
            Giocondas every few minutes.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-lg text-neutral-200">Browse by ID</h2>
          <p className="mt-2 text-sm text-neutral-400">
            Any Gioconda can be visited directly at{" "}
            <code className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-xs">
              /giocondas/&lt;id&gt;
            </code>{" "}
            from 1 to {count?.toLocaleString("en-US")}. Try{" "}
            {[1, 1000, 20000, count ?? 43469].map((n, i, arr) => (
              <span key={n}>
                <Link
                  href={`/giocondas/${n}`}
                  className="underline decoration-neutral-600 underline-offset-2 hover:text-neutral-100"
                >
                  #{n}
                </Link>
                {i < arr.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </section>
      </div>
    </main>
  );
}
