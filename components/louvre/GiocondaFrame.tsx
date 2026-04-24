"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Marco dorado ornamentado de la Gioconda con la foto real del marco del Louvre
 * como textura frontal, y dos planos internos con cross-fade entre Giocondas.
 */

const FRAME_W = 0.83;
const FRAME_H = FRAME_W * (1659 / 1240); // aspect de la textura real (sin borde)
const FRAME_DEPTH = 0.06;

// Recorte interior (% del marco) — porción de la textura ocupada por el lienzo
const INNER_LEFT_PCT = 0.165;
const INNER_RIGHT_PCT = 0.835;
const INNER_TOP_PCT = 0.14;
const INNER_BOTTOM_PCT = 0.86;

const INNER_W = FRAME_W * (INNER_RIGHT_PCT - INNER_LEFT_PCT);
const INNER_H = FRAME_H * (INNER_BOTTOM_PCT - INNER_TOP_PCT);
const INNER_OFFSET_X = FRAME_W * ((INNER_LEFT_PCT + INNER_RIGHT_PCT) / 2 - 0.5);
const INNER_OFFSET_Y = -FRAME_H * ((INNER_TOP_PCT + INNER_BOTTOM_PCT) / 2 - 0.5);

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
  const [fade, setFade] = useState(1);

  const frameTexture = useTexture("/frame/gioconda-frame-louvre.jpg");
  useEffect(() => {
    frameTexture.colorSpace = THREE.SRGBColorSpace;
    frameTexture.anisotropy = 16;
    frameTexture.center.set(0.5, 0.5);
    frameTexture.repeat.set(1.0, 1.0);
    frameTexture.needsUpdate = true;
  }, [frameTexture]);

  const currentUrl = order[currentIdx % order.length];
  const nextUrl = order[(currentIdx + 1) % order.length];

  useEffect(() => {
    if (currentIdx > 0 && currentIdx % order.length === 0) {
      setOrder(shuffle(urls));
    }
  }, [currentIdx, order.length, urls]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(0);
      setTimeout(() => {
        setCurrentIdx((i) => i + 1);
        setFade(1);
      }, 1200);
    }, cycleDuration * 1000);
    return () => clearInterval(interval);
  }, [cycleDuration]);

  return (
    <group position={[0, y, z]}>
      <mesh castShadow position={[0, 0, -FRAME_DEPTH / 2]}>
        <boxGeometry args={[FRAME_W, FRAME_H, FRAME_DEPTH]} />
        <meshStandardMaterial color="#6a4e15" roughness={0.55} metalness={0.55} />
      </mesh>

      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[FRAME_W, FRAME_H]} />
        <meshStandardMaterial
          map={frameTexture}
          roughness={0.42}
          metalness={0.35}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Fondo negro que tapa la Gioconda original */}
      <mesh position={[INNER_OFFSET_X, INNER_OFFSET_Y, 0.003]}>
        <planeGeometry args={[INNER_W, INNER_H]} />
        <meshBasicMaterial color="#0a0806" />
      </mesh>

      {/* Gioconda actual + siguiente con cross-fade */}
      <GiocondaPlane url={currentUrl} opacity={fade} zOffset={0.007} />
      <GiocondaPlane url={nextUrl} opacity={1 - fade} zOffset={0.006} />
    </group>
  );
}

/**
 * Hook para cargar una textura cross-origin manualmente (no bloquea Suspense).
 * Devuelve null mientras carga o si falla, lo cual es exactamente lo que necesitamos
 * para un cross-fade suave — el plane se oculta hasta que la imagen está lista.
 */
function useCrossOriginTexture(url: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (tex) => {
        if (cancelled) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.needsUpdate = true;
        setTexture(tex);
      },
      undefined,
      (err) => {
        if (!cancelled) console.warn("Texture load failed:", url, err);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  // cleanup al desmontar
  useEffect(() => {
    return () => {
      texture?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texture]);

  return texture;
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
  const texture = useCrossOriginTexture(url);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity,
        texture ? opacity : 0,
        0.06,
      );
    }
  });

  const { planeW, planeH, repeat, offset } = useMemo(() => {
    const img = texture?.image as HTMLImageElement | undefined;
    const imgRatio = img && img.width ? img.height / img.width : 1.5;
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
    return { planeW: INNER_W, planeH: INNER_H, repeat: [rx, ry], offset: [ox, oy] };
  }, [texture]);

  useEffect(() => {
    if (texture) {
      texture.repeat.set(repeat[0], repeat[1]);
      texture.offset.set(offset[0], offset[1]);
    }
  }, [texture, repeat, offset]);

  if (!texture) return null;

  return (
    <mesh position={[INNER_OFFSET_X, INNER_OFFSET_Y, zOffset]}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={0}
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
