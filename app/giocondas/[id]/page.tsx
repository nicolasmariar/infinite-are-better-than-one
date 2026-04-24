import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { giocondaUrl } from "@/lib/r2/urls";
import { giocondaMetadata } from "@/lib/seo/metadata";
import { giocondaJsonLd } from "@/lib/seo/jsonld";
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
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8 lg:flex-row lg:items-start lg:gap-12">
        <header className="lg:sticky lg:top-10 lg:w-80 lg:shrink-0">
          <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
            ← back to the Louvre
          </Link>
          <h1 className="mt-4 font-serif text-3xl leading-tight">Gioconda #{g.id}</h1>
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
            alt={`Gioconda #${g.id} reimagined in the style of ${primaryLabel}`}
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
        </div>
      </div>
    </main>
  );
}
