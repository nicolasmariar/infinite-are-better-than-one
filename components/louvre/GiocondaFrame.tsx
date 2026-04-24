"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Marco dorado ornamentado de la Gioconda, usando como textura frontal la foto real
 * del marco del Louvre (hojas de acanto + perlas + filetes dorados).
 *
 * El plane frontal tiene la imagen completa (incluye la Gioconda original).
 * Encima, pintamos la Gioconda actual del ciclo con un tamaño que tape EXACTAMENTE
 * el recorte interior del marco de referencia (así las molduras doradas siempre
 * quedan visibles, la cara central es la única que cambia).
 *
 * Proporciones reales del cuadro + marco del Louvre:
 *   Cuadro: 77cm × 53cm
 *   Marco total: ~109cm × 83cm (ratio ancho/alto ≈ 0.76)
 */

// Tamaño del marco (aspect ratio exacto de la textura recortada 1240×1659 = 0.7474)
const FRAME_W = 0.83;
const FRAME_H = FRAME_W * (1659 / 1240); // 1.1104 — mismo ratio que la textura, sin deformación
const FRAME_DEPTH = 0.06;

// Recorte interior donde va la imagen (% del marco — medido sobre la foto de referencia)
const INNER_LEFT_PCT = 0.165;
const INNER_RIGHT_PCT = 0.835;
const INNER_TOP_PCT = 0.14;
const INNER_BOTTOM_PCT = 0.86;

const INNER_W = FRAME_W * (INNER_RIGHT_PCT - INNER_LEFT_PCT);
const INNER_H = FRAME_H * (INNER_BOTTOM_PCT - INNER_TOP_PCT);
// Offset del centro del interior respecto al centro del marco
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
    // Escalar un poco la textura para que desborde el plane (elimina el borde negro exterior)
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
      {/* Profundidad del marco (box sólida para la silueta lateral) */}
      <mesh castShadow position={[0, 0, -FRAME_DEPTH / 2]}>
        <boxGeometry args={[FRAME_W, FRAME_H, FRAME_DEPTH]} />
        <meshStandardMaterial
          color="#6a4e15"
          roughness={0.55}
          metalness={0.55}
        />
      </mesh>

      {/* Plane frontal con la textura real del marco del Louvre */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[FRAME_W, FRAME_H]} />
        <meshStandardMaterial
          map={frameTexture}
          roughness={0.42}
          metalness={0.35}
          envMapIntensity={0.6}
        />
      </mesh>

      {/* Tapamos el recorte interior con un plano negro para eliminar la Gioconda original */}
      <mesh position={[INNER_OFFSET_X, INNER_OFFSET_Y, 0.003]}>
        <planeGeometry args={[INNER_W, INNER_H]} />
        <meshBasicMaterial color="#0a0806" />
      </mesh>

      {/* Gioconda actual — llena exactamente el recorte */}
      <GiocondaPlane url={currentUrl} opacity={fade} zOffset={0.007} />
      {/* Gioconda siguiente (cross-fade) */}
      <GiocondaPlane url={nextUrl} opacity={1 - fade} zOffset={0.006} />
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
  const texture = useTexture(url);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, opacity, 0.06);
    }
  });

  // El plane llena el recorte interior con el aspecto real de la Gioconda
  // (si la Gioconda generada tiene otro ratio, se hace cover centrado usando
  // repeat/offset de la textura para no deformar el marco)
  const { planeW, planeH, repeat, offset } = useMemo(() => {
    const img = texture.image as HTMLImageElement | undefined;
    const imgRatio = img && img.width ? img.height / img.width : 1.5;
    const slotRatio = INNER_H / INNER_W;

    // Cover: el plane SIEMPRE es del tamaño del slot, y tocamos los UV para
    // que la imagen llene sin deformarse (crop).
    let rx = 1,
      ry = 1,
      ox = 0,
      oy = 0;
    if (imgRatio > slotRatio) {
      // imagen más vertical que el slot: cropear vertical
      const scale = slotRatio / imgRatio;
      ry = scale;
      oy = (1 - scale) / 2;
    } else {
      // imagen más horizontal: cropear horizontal
      const scale = imgRatio / slotRatio;
      rx = scale;
      ox = (1 - scale) / 2;
    }
    return { planeW: INNER_W, planeH: INNER_H, repeat: [rx, ry], offset: [ox, oy] };
  }, [texture]);

  useEffect(() => {
    texture.repeat.set(repeat[0], repeat[1]);
    texture.offset.set(offset[0], offset[1]);
  }, [texture, repeat, offset]);

  return (
    <mesh position={[INNER_OFFSET_X, INNER_OFFSET_Y, zOffset]}>
      <planeGeometry args={[planeW, planeH]} />
      <meshBasicMaterial
        ref={matRef}
        map={texture}
        transparent
        opacity={opacity}
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
