"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Room } from "./Room";
import { Vitrine } from "./Vitrine";
import { Bench } from "./Bench";
import { GiocondaFrame } from "./GiocondaFrame";
import { CameraRig } from "./CameraRig";
import { Lighting } from "./Lighting";
import { GIOCONDA_Y, GIOCONDA_Z } from "./dimensions";

/**
 * Detecta si el device es "mobile" en el sentido de GPU budget:
 * pantalla pequeña O pointer coarse O deviceMemory bajo. Esto nos permite
 * bajar calidad (sin shadows, DPR más bajo) en teléfonos que de otro modo
 * tardan 3-4s extra en renderizar.
 */
function detectMobileQuality(): boolean {
  if (typeof window === "undefined") return false;
  const smallScreen = window.innerWidth < 820;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  // deviceMemory solo existe en Chrome/Edge — fallback conservador.
  const deviceMem = (navigator as unknown as { deviceMemory?: number })
    .deviceMemory;
  const lowMem = typeof deviceMem === "number" && deviceMem <= 4;
  return smallScreen || coarse || lowMem;
}

export function LouvreScene({
  giocondaUrls,
  cycleDuration = 60,
}: {
  giocondaUrls: string[];
  cycleDuration?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  // La detección corre una sola vez al mount (evita re-crear Canvas).
  const isMobile = useMemo(() => detectMobileQuality(), []);

  // Workaround para un bug en React 19 + R3F: en ciertos casos el Canvas
  // monta con el parent a 0x0 y no vuelve a medirse. Disparamos un resize
  // explícito tras la hidratación para forzar el redimensionado.
  useEffect(() => {
    const fire = () => window.dispatchEvent(new Event("resize"));
    // Doble dispatch: uno en el próximo frame y otro un poco después para
    // asegurar que la medición real del DOM ya es estable.
    requestAnimationFrame(fire);
    const t = setTimeout(fire, 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={wrapRef} className="fixed inset-0 bg-[#0a0d13]">
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [1, 1.25] : [1, 1.6]}
        camera={{ position: [0, 1.65, 1.5], fov: 55, near: 0.05, far: 80 }}
        gl={{
          antialias: !isMobile,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <color attach="background" args={["#0a0d13"]} />

        <Suspense fallback={null}>
          <Lighting lowQuality={isMobile} />
          <Room />
          <Vitrine />
          <Bench />
          <GiocondaFrame
            urls={giocondaUrls}
            cycleDuration={cycleDuration}
            y={GIOCONDA_Y}
            z={GIOCONDA_Z}
          />
        </Suspense>

        <CameraRig />
      </Canvas>
    </div>
  );
}
