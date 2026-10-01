"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Wrapper que hace lazy del LouvreScene entero. El chunk con Three.js +
 * drei + todas las geometrías (~900 KB minificado) se baja en paralelo con
 * el resto de la página, pero la UI del HeaderOverlay y el preload del
 * marco ya arrancan al instante.
 *
 * `ssr: false` evita que Next intente prerender el Canvas en server — no
 * es posible sin WebGL.
 */
const LouvreScene = dynamic(
  () => import("./LouvreScene").then((m) => m.LouvreScene),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-[#0a0d13]" aria-hidden>
        {/* Suave luz central mientras carga — coincide con el spot del cuadro */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 45% 40% at 50% 42%, rgba(255,240,200,0.04) 0%, rgba(10,13,19,0) 70%)",
          }}
        />
      </div>
    ),
  },
);

// === Opción B del plan de perf: preload del chunk ===
// Apenas este módulo se evalúa en el browser (durante hidratación), disparamos
// el import() del chunk de LouvreScene. El chunk se baja en paralelo con el
// resto del trabajo de hidratación, así que para cuando React quiere renderizar
// LouvreScene, el JS ya está en memoria → ~300-800 ms menos de TTI en mobile.
type PreloadableComponent = ComponentType<unknown> & {
  preload?: () => Promise<unknown>;
};
if (typeof window !== "undefined") {
  const p = LouvreScene as unknown as PreloadableComponent;
  p.preload?.();
}

export function LouvreSceneLazy(props: {
  giocondaUrls: string[];
  cycleDuration?: number;
}) {
  return <LouvreScene {...props} />;
}
