"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Botón "About" que despliega un panel flotante con la memoria conceptual,
 * técnica y bio del artista. Se abre en hover (desktop) y en click (mobile).
 * Cierra al click afuera, al presionar Escape, o al volver a clickear el botón.
 */
export function AboutPopover() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-neutral-600/50 bg-neutral-900/40 px-3 py-1.5 text-neutral-200 backdrop-blur-sm transition hover:bg-neutral-800/50"
        aria-expanded={open}
      >
        About
      </button>

      <div
        role="dialog"
        aria-label="About this work"
        className={`absolute right-0 top-full mt-2 w-[min(92vw,28rem)] max-h-[70vh] overflow-y-auto rounded-2xl border border-neutral-700/60 bg-neutral-950/85 p-5 text-left text-xs leading-relaxed text-neutral-200 shadow-2xl backdrop-blur-md transition sm:text-sm ${
          open ? "opacity-100 translate-y-0" : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <section>
          <h3 className="mb-1.5 font-serif text-base font-medium text-neutral-50">
            Conceptual Statement
          </h3>
          <p>
            <em>infinite are better than one</em> is a generative installation and web
            app that combines artificial intelligence, databases, and physical devices
            to reimagine infinite versions of the <em>Mona Lisa</em> through the visual
            languages of Argentine art. It puts into tension the idea of
            &ldquo;masterpiece&rdquo; and its technical reproducibility in the digital era.
            By transposing the supreme icon of European cultural heritage into Latin
            American visual territory, it opens fundamental questions about cultural
            identity, authorship, shared visual memory, and the preservation of
            national art in the face of the global hegemonic technological revolution.
          </p>
        </section>

        <section className="mt-4">
          <h3 className="mb-1.5 font-serif text-base font-medium text-neutral-50">
            Technical Statement
          </h3>
          <p>
            The project&apos;s core runs on 12 open-source AI models independently
            trained by the artist with works by Argentine masters (Marta Minujín,
            Antonio Berni, Xul Solar, Julio Le Parc) and popular expressions
            (Fileteado Porteño, Indigenous Art, El Eternauta). It processes in real
            time an ever-expanding dataset that currently exceeds 55,000 unique
            images. The installation version of this work has been selected as
            Finalist for the <strong>Premio Prilidiano Pueyrredón 2025</strong>.
          </p>
        </section>

        <section className="mt-4">
          <h3 className="mb-1.5 font-serif text-base font-medium text-neutral-50">
            Bio
          </h3>
          <p>
            Nicolás Ruarte / NoMa is an AI artist and developer, teacher and
            university researcher with over 20 years of experience. Founder of{" "}
            <strong>NoMa Studio AI</strong> and professor-researcher at Universidad
            Nacional de las Artes (UNA), Universidad Austral, and Otro Mundo.
          </p>
        </section>
      </div>
    </div>
  );
}
