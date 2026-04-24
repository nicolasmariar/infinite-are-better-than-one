"use client";

/**
 * Overlay superior minimalista con el título de la obra y link a /giocondas (mapa 3D).
 * Diseñado para estar siempre visible pero que no obstruya la experiencia
 * de la sala. En mobile se reduce a iconografía.
 */
import Link from "next/link";
import { AboutPopover } from "./AboutPopover";

export function HeaderOverlay() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4 sm:p-6">
      <div className="pointer-events-auto max-w-[60%]">
        <h1 className="font-serif text-lg font-medium leading-tight text-neutral-50 sm:text-2xl">
          infinite are better than one
        </h1>
        <p className="mt-1 text-xs text-neutral-400">by NoMa</p>
      </div>
      <nav className="pointer-events-auto flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
        <Link
          href="/giocondas"
          className="rounded-full border border-neutral-600/50 bg-neutral-900/40 px-3 py-1.5 text-neutral-200 backdrop-blur-sm transition hover:bg-neutral-800/50"
        >
          All Giocondas
        </Link>
        <AboutPopover />
      </nav>
    </div>
  );
}
