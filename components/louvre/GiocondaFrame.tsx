"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

/**
 * Marco dorado ornamentado de la Gioconda con la foto real del marco del Louvre
 * como textura frontal, y dos planos internos con cross-fade entre Giocondas.
 */

const FRAME_W = 0.83;
const FRAME_H = FRAME_W * (1659 / 1240); // aspect de la textura real (sin borde)
const FRAME_DEPTH = 0.06;

// Recorte interior (% del marco) — porción de la textura ocupada por el lienzo.
// Medido sobre la foto real del marco del Louvre: el lienzo va hasta casi
// el filo interior de la moldura dorada, con mínimo overlap.
const INNER_LEFT_PCT = 0.148;
const INNER_RIGHT_PCT = 0.858;
const INNER_TOP_PCT = 0.118;
const INNER_BOTTOM_PCT = 0.888;

const INNER_W = FRAME_W * (INNER_RIGHT_PCT - INNER_LEFT_PCT);
const INNER_H = FRAME_H * (INNER_BOTTOM_PCT - INNER_TOP_PCT);
const INNER_OFFSET_X = FRAME_W * ((INNER_LEFT_PCT + INNER_RIGHT_PCT) / 2 - 0.5);
const INNER_OFFSET_Y = -FRAME_H * ((INNER_TOP_PCT + INNER_BOTTOM_PCT) / 2 - 0.5);

// Z-offsets muy cercanos entre sí — los planos quedan prácticamente flush
// contra la superficie del marco, sin flotar. Orden de atrás hacia adelante:
// frame texture (0.001) → black bg (0.0014) → next (0.0018) → current (0.0022)
const FRAME_TEX_Z = 0.001;
const BLACK_BG_Z = 0.0014;
const GIOCONDA_NEXT_Z = 0.0018;
const GIOCONDA_CURRENT_Z = 0.0022;

const FADE_MS = 1200;

// Cache global de texturas cargadas — sobrevive cross-fades y re-renders.
const textureCache = new Map<string, THREE.Texture>();
const textureInflight = new Map<string, Promise<THREE.Texture>>();

function loadGiocondaTexture(url: string): Promise<THREE.Texture> {
  const cached = textureCache.get(url);
  if (cached) return Promise.resolve(cached);

  const inflight = textureInflight.get(url);
  if (inflight) return inflight;

  const promise = new Promise<THREE.Texture>((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        tex.needsUpdate = true;
        textureCache.set(url, tex);
        textureInflight.delete(url);
        resolve(tex);
      },
      undefined,
      (err) => {
        textureInflight.delete(url);
        console.warn("[Gioconda] load failed:", url, err);
        reject(err);
      },
    );
  });

  textureInflight.set(url, promise);
  return promise;
}

/** Precarga una URL en el cache sin esperar el resultado. */
function prefetchGioconda(url: string) {
  if (!textureCache.has(url) && !textureInflight.has(url)) {
    loadGiocondaTexture(url).catch(() => {});
  }
}

export function GiocondaFrame({
  urls,
  cycleDuration = 60,
  y = 2.0,
  z = -5.87,
}: {
  urls: string[];
  cycleDuration?: number;
  y?: number;
  z?: number;
}) {
  const [order, setOrder] = useState(() => shuffle(urls));
  const [currentIdx, setCurrentIdx] = useState(0);
  // `fade` es 1 en reposo (current visible, next oculto) y baja a 0 durante
  // la transición. Después del swap vuelve a 1 INSTANTÁNEAMENTE, sin animar.
  const [fade, setFade] = useState(1);
  const fadeRafRef = useRef<number | null>(null);

  const frameTexture = useTexture("/frame/gioconda-frame-louvre.webp");
  useEffect(() => {
    frameTexture.colorSpace = THREE.SRGBColorSpace;
    frameTexture.anisotropy = 16;
    frameTexture.center.set(0.5, 0.5);
    frameTexture.repeat.set(1.0, 1.0);
    frameTexture.needsUpdate = true;
  }, [frameTexture]);

  const currentUrl = order[currentIdx % order.length];
  const nextUrl = order[(currentIdx + 1) % order.length];
  const lookaheadUrl = order[(currentIdx + 2) % order.length];

  // Precargamos "next" y el "next-next" apenas cambia currentIdx.
  // Cuando arranca la transición, las dos texturas ya están en el cache.
  useEffect(() => {
    prefetchGioconda(nextUrl);
    prefetchGioconda(lookaheadUrl);
  }, [nextUrl, lookaheadUrl]);

  useEffect(() => {
    if (currentIdx > 0 && currentIdx % order.length === 0) {
      setOrder(shuffle(urls));
    }
  }, [currentIdx, order.length, urls]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Cancela cualquier animación previa que no haya terminado.
      if (fadeRafRef.current != null) cancelAnimationFrame(fadeRafRef.current);

      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        setFade(1 - t); // 1 → 0
        if (t < 1) {
          fadeRafRef.current = requestAnimationFrame(tick);
        } else {
          // Transición completa: swap en el MISMO batch de React para que
          // el próximo render tenga {currentUrl=was-next, fade=1}.
          fadeRafRef.current = null;
          setCurrentIdx((i) => i + 1);
          setFade(1);
        }
      };
      fadeRafRef.current = requestAnimationFrame(tick);
    }, cycleDuration * 1000);

    return () => {
      clearInterval(interval);
      if (fadeRafRef.current != null) cancelAnimationFrame(fadeRafRef.current);
    };
  }, [cycleDuration]);

  return (
    <group position={[0, y, z]}>
      <mesh castShadow position={[0, 0, -FRAME_DEPTH / 2]}>
        <boxGeometry args={[FRAME_W, FRAME_H, FRAME_DEPTH]} />
        <meshStandardMaterial color="#6a4e15" roughness={0.55} metalness={0.55} />
      </mesh>

      <mesh position={[0, 0, FRAME_TEX_Z]}>
        <planeGeometry args={[FRAME_W, FRAME_H]} />
        <meshStandardMaterial
          map={frameTexture}
          roughness={0.42}
          metalness={0.35}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Fondo negro que tapa la Gioconda original — casi flush contra el marco */}
      <mesh position={[INNER_OFFSET_X, INNER_OFFSET_Y, BLACK_BG_Z]}>
        <planeGeometry args={[INNER_W, INNER_H]} />
        <meshBasicMaterial color="#0a0806" />
      </mesh>

      {/* Current: siempre visible en reposo, hace fade-out durante transición */}
      <GiocondaPlane url={currentUrl} opacity={fade} zOffset={GIOCONDA_CURRENT_Z} />
      {/* Next: invisible en reposo, hace fade-in durante transición */}
      <GiocondaPlane url={nextUrl} opacity={1 - fade} zOffset={GIOCONDA_NEXT_Z} />
    </group>
  );
}

function GiocondaPlane({
  url,
  opacity,
  zOffset,
}: {
  url: string;
  opacity: number;
  zOffset: number;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(
    () => textureCache.get(url) ?? null,
  );
  const [trackedUrl, setTrackedUrl] = useState(url);

  // Derived state: cuando cambia la url, sincronizamos texture desde el cache
  // EN EL MISMO render (antes de comitear). Así evitamos el frame con state
  // stale que hace flashear el plano negro durante el swap.
  if (trackedUrl !== url) {
    setTrackedUrl(url);
    setTexture(textureCache.get(url) ?? null);
  }

  useEffect(() => {
    const cached = textureCache.get(url);
    if (cached) {
      setTexture(cached);
      return;
    }
    let cancelled = false;
    loadGiocondaTexture(url)
      .then((tex) => {
        if (!cancelled) setTexture(tex);
      })
      .catch(() => {
        /* warning ya loggeado */
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const { repeat, offset } = useMemo(() => {
    const img = texture?.image as HTMLImageElement | undefined;
    const imgW = img?.naturalWidth || img?.width || 0;
    const imgH = img?.naturalHeight || img?.height || 0;
    const imgRatio = imgW > 0 ? imgH / imgW : 1.5;
    const slotRatio = INNER_H / INNER_W;
    let rx = 1,
      ry = 1,
      ox = 0,
      oy = 0;
    if (imgRatio > slotRatio) {
      const scale = slotRatio / imgRatio;
      ry = scale;
      oy = (1 - scale) / 2;
    } else {
      const scale = imgRatio / slotRatio;
      rx = scale;
      ox = (1 - scale) / 2;
    }
    return {
      repeat: [rx, ry] as [number, number],
      offset: [ox, oy] as [number, number],
    };
  }, [texture]);

  useEffect(() => {
    if (texture) {
      texture.repeat.set(repeat[0], repeat[1]);
      texture.offset.set(offset[0], offset[1]);
      texture.needsUpdate = true;
    }
  }, [texture, repeat, offset]);

  // Sin textura: no renderizamos (el plano negro de fondo cubre el hueco).
  if (!texture) return null;

  // Opacity controlado directamente via prop. transparent solo durante fade.
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  return (
    <mesh position={[INNER_OFFSET_X, INNER_OFFSET_Y, zOffset]} renderOrder={1}>
      <planeGeometry args={[INNER_W, INNER_H]} />
      <meshBasicMaterial
        key={texture.uuid}
        attach="material"
        map={texture}
        transparent={clampedOpacity < 1}
        opacity={clampedOpacity}
        toneMapped={false}
      />
    </mesh>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
