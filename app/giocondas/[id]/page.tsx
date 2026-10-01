import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { giocondaUrl } from "@/lib/r2/urls";
import { giocondaMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, giocondaJsonLd } from "@/lib/seo/jsonld";
import type { Gioconda } from "@/lib/supabase/types";

export const revalidate = 3600; // ISR 1h por página

async function getGioconda(id: number): Promise<Gioconda | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("giocondas").select("*").eq("id", id).single();
  return (data as Gioconda) ?? null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const g = await getGioconda(parseInt(id, 10));
  if (!g) return { title: "Gioconda not found" };
  return giocondaMetadata(g);
}

export default async function GiocondaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const giocondaId = parseInt(id, 10);
  if (isNaN(giocondaId)) notFound();

  const g = await getGioconda(giocondaId);
  if (!g) notFound();

  const mediumUrl = giocondaUrl(g.filename, "medium");
  const originalUrl = giocondaUrl(g.filename, "original");
  const primaryLabel = g.primary_style
    ? g.primary_style.replace(/_AI.*$/, "").replace(/_/g, " ")
    : "mixed styles";

  return (
    <main className="min-h-dvh bg-[#0a0d13] text-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(giocondaJsonLd(g)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(g.id)),
        }}
      />
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:flex-row lg:items-start lg:gap-12">
        <header className="lg:sticky lg:top-10 lg:w-80 lg:shrink-0">
          {/* Breadcrumbs visibles — duplican el BreadcrumbList JSON-LD arriba
              para una señal doble a Google y navegación clara para usuarios. */}
          <nav aria-label="Breadcrumb" className="text-xs text-neutral-500">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-neutral-300">
                  Home
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href="/giocondas" className="hover:text-neutral-300">
                  All Giocondas
                </Link>
              </li>
              <li aria-hidden>›</li>
              <li className="text-neutral-400">#{g.id}</li>
            </ol>
          </nav>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-neutral-400 hover:text-neutral-200"
          >
            ← back to the Louvre
          </Link>
          <h1 className="mt-4 font-serif text-3xl leading-tight">
            Gioconda #{g.id} generada con IA
          </h1>
          <p className="mt-1 font-serif text-sm italic text-neutral-500">
            Mona Lisa #{g.id} — AI-generated in the style of{" "}
            <span className="lowercase">{primaryLabel}</span>
          </p>
          <p className="mt-2 text-sm uppercase tracking-widest text-neutral-400">
            {primaryLabel}
            {g.is_mixed && " · mixed"}
          </p>
          <dl className="mt-6 space-y-3 text-sm text-neutral-300">
            {g.model_checkpoint && (
              <div>
                <dt className="text-neutral-500">Model</dt>
                <dd>{g.model_checkpoint}</dd>
              </div>
            )}
            {g.seed !== null && g.seed !== undefined && (
              <div>
                <dt className="text-neutral-500">Seed</dt>
                <dd className="font-mono text-xs">{g.seed}</dd>
              </div>
            )}
            {g.sampler && (
              <div>
                <dt className="text-neutral-500">Sampler</dt>
                <dd>
                  {g.sampler}
                  {g.steps ? ` · ${g.steps} steps` : null}
                  {g.cfg_scale ? ` · CFG ${g.cfg_scale}` : null}
                </dd>
              </div>
            )}
            {g.loras && g.loras.length > 0 && (
              <div>
                <dt className="text-neutral-500">LoRAs</dt>
                <dd>
                  <ul className="mt-1 space-y-0.5 font-mono text-xs">
                    {g.loras.map((l) => (
                      <li key={l.name}>
                        {l.name.replace(/_AI.*$/, "").replace(/_/g, " ")}{" "}
                        <span className="text-neutral-500">:{l.weight.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
          <a
            href={originalUrl}
            download={g.filename}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-600/50 bg-neutral-900/40 px-4 py-2 text-sm transition hover:bg-neutral-800/50"
          >
            Download original
          </a>
        </header>
        <div className="relative mx-auto w-full max-w-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediumUrl}
            alt={`Gioconda #${g.id} — Mona Lisa reimaginada por IA en el estilo de ${primaryLabel}. Arte argentino generativo con inteligencia artificial. AI-generated Mona Lisa in the style of ${primaryLabel}.`}
            width={g.width}
            height={g.height}
            loading="eager"
            className="h-auto w-full rounded-sm shadow-2xl"
          />
          {g.prompt && (
            <blockquote className="mt-6 border-l-2 border-neutral-700 pl-4 text-sm italic text-neutral-400">
              &ldquo;{g.prompt}&rdquo;
            </blockquote>
          )}

          {/* Contenido SEO-rich bilingüe al pie — sin romper el foco visual
              en la obra, pero dándole a Google texto que rankear para cada
              una de las 43k páginas. */}
          <section className="mt-10 space-y-4 text-sm leading-relaxed text-neutral-400">
            <p>
              Esta es la <strong>Gioconda #{g.id}</strong>, una de las{" "}
              <strong>43.469 Giocondas</strong> generadas con inteligencia
              artificial en <em>Infinite are better than one</em>,
              obra de <Link href="/" className="underline hover:text-neutral-200">Nicolás Ruarte</Link>{" "}
              finalista del Premio Prilidiano Pueyrredón de Artes Visuales 2025.
              {!g.is_mixed && g.primary_style && (
                <>
                  {" "}La imagen fue producida por un LoRA entrenado sobre la obra
                  de <strong>{primaryLabel}</strong>, uno de los doce artistas
                  argentinos que componen el dataset.
                </>
              )}
            </p>
            <p>
              This is <strong>Gioconda #{g.id}</strong>, part of a collection of
              43,469 unique Mona Lisas generated with AI models trained on
              Argentine artists. Each image is a one-off reinterpretation produced
              by Stable Diffusion with a LoRA applied.
            </p>
            <p className="text-xs">
              ← <Link href="/giocondas" className="underline hover:text-neutral-200">
                Ver las 43.469 Giocondas
              </Link>
              {" · "}
              <Link href="/" className="underline hover:text-neutral-200">
                Volver al Louvre virtual
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
