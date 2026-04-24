"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { makeWoodMelamine, makeVelvetWall } from "@/lib/three/textures";
import {
  NICHE_W,
  NICHE_H,
  NICHE_BOTTOM_Y,
  NICHE_TOP_Y,
  NICHE_CENTER_Y,
  NICHE_LEFT_X,
  NICHE_RIGHT_X,
  NICHE_DEPTH,
  NICHE_BACK_Z,
  WALL_FRONT_Z,
  GLASS_Z,
} from "./dimensions";
import { WallPlane } from "./WallPanel";

/**
 * Estructura alrededor de la Gioconda:
 *
 *   1. Interior del nicho (hueco inset en la pared trasera):
 *        - Fondo plane en z = NICHE_BACK_Z
 *        - 4 paredes interiores (top/bottom/left/right) que forman la caja
 *
 *   2. Vidrio protector al ras de la pared frontal (cerrando la boca del nicho)
 *
 *   3. Tarima + pedestal FUERA de la pared, debajo del nicho (sobresale hacia
 *      el visitante, tocando la base del hueco desde afuera).
 */
export function Vitrine() {
  const melamine = useMemo(() => makeWoodMelamine(1024), []);
  const velvet = useMemo(() => makeVelvetWall(1024), []);

  return (
    <group>
      {/* === INTERIOR DEL NICHO ===
          - Fondo: continúa el tiling de la pared exterior (mismo uvOffset X).
          - Piso del nicho: acortado 3cm para no intersectar con el tope del cajón. */}
      <WallPlane
        position={[0, NICHE_CENTER_Y, NICHE_BACK_Z]}
        size={[NICHE_W, NICHE_H]}
        velvet={velvet}
        uvOffset={[NICHE_LEFT_X, NICHE_BOTTOM_Y]}
      />
      <WallPlane
        position={[0, NICHE_TOP_Y - 0.001, NICHE_BACK_Z + NICHE_DEPTH / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        size={[NICHE_W, NICHE_DEPTH - 0.02]}
        velvet={velvet}
      />
      {/* Piso del nicho: retraído 3cm del borde frontal para evitar Z-fighting con
          el tope del cajón de madera (que toca z = WALL_FRONT_Z). */}
      <WallPlane
        position={[0, NICHE_BOTTOM_Y + 0.001, NICHE_BACK_Z + (NICHE_DEPTH - 0.03) / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        size={[NICHE_W, NICHE_DEPTH - 0.03]}
        velvet={velvet}
      />
      <WallPlane
        position={[NICHE_LEFT_X + 0.001, NICHE_CENTER_Y, NICHE_BACK_Z + NICHE_DEPTH / 2]}
        rotation={[0, Math.PI / 2, 0]}
        size={[NICHE_DEPTH - 0.02, NICHE_H]}
        velvet={velvet}
      />
      <WallPlane
        position={[NICHE_RIGHT_X - 0.001, NICHE_CENTER_Y, NICHE_BACK_Z + NICHE_DEPTH / 2]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[NICHE_DEPTH - 0.02, NICHE_H]}
        velvet={velvet}
      />

      {/* === VIDRIO AL RAS DE LA PARED === */}
      <VitrineGlass />

      {/* === TARIMA + PEDESTAL FUERA DE LA PARED === */}
      <OuterTarima melamine={melamine} />
    </group>
  );
}

/**
 * Cajón único de madera melamina delante de la pared, pegado al vidrio desde abajo.
 * Altura modesta (mitad del alto que tenía el conjunto anterior), profundidad amplia
 * (el doble — sobresale generosamente hacia el visitante).
 * La parte superior queda exactamente a la altura de la base del nicho.
 */
function OuterTarima({ melamine }: { melamine: THREE.Texture }) {
  const TARIMA_H = 0.26; // bajo — desde la boca del vidrio hacia abajo solo un cajón chato
  const DEPTH = 0.84; // profundo, sobresale generosamente

  const startZ = WALL_FRONT_Z; // -6, tocando la pared
  const centerZ = startZ + DEPTH / 2;

  const TARIMA_W = NICHE_W - 0.04; // ancho del nicho con pequeño margen

  // El tope del cajón coincide con la base del nicho (NICHE_BOTTOM_Y = 1.05)
  const tarimaY = NICHE_BOTTOM_Y - TARIMA_H / 2;

  return (
    <group>
      <mesh position={[0, tarimaY, centerZ]} receiveShadow castShadow>
        <boxGeometry args={[TARIMA_W, TARIMA_H, DEPTH]} />
        <meshStandardMaterial map={melamine} roughness={0.45} metalness={0.06} />
      </mesh>

      {/* Remate superior ligeramente más claro para que se note la tapa del cajón */}
      <mesh position={[0, NICHE_BOTTOM_Y + 0.003, centerZ]} receiveShadow>
        <boxGeometry args={[TARIMA_W, 0.006, DEPTH]} />
        <meshStandardMaterial map={melamine} roughness={0.35} metalness={0.1} />
      </mesh>
    </group>
  );
}

function VitrineGlass() {
  const GLASS_W = NICHE_W - 0.02;
  const GLASS_H = NICHE_H - 0.02;
  const barThickness = 0.025;
  const barColor = "#c0c3c8";

  const barMat = (
    <meshStandardMaterial color={barColor} roughness={0.3} metalness={0.88} />
  );

  return (
    <group position={[0, NICHE_CENTER_Y, GLASS_Z]}>
      {/* Vidrio templado cerrando la boca del nicho */}
      <mesh>
        <boxGeometry args={[GLASS_W, GLASS_H, 0.015]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.12}
          roughness={0.03}
          transmission={0.94}
          thickness={0.015}
          ior={1.52}
          clearcoat={1}
          clearcoatRoughness={0.01}
          envMapIntensity={2}
        />
      </mesh>

      {/* Marco metálico perimetral */}
      <mesh position={[0, GLASS_H / 2, 0]}>
        <boxGeometry args={[GLASS_W + barThickness * 2, barThickness, barThickness * 1.4]} />
        {barMat}
      </mesh>
      <mesh position={[0, -GLASS_H / 2, 0]}>
        <boxGeometry args={[GLASS_W + barThickness * 2, barThickness, barThickness * 1.4]} />
        {barMat}
      </mesh>
      <mesh position={[-GLASS_W / 2, 0, 0]}>
        <boxGeometry args={[barThickness, GLASS_H, barThickness * 1.4]} />
        {barMat}
      </mesh>
      <mesh position={[GLASS_W / 2, 0, 0]}>
        <boxGeometry args={[barThickness, GLASS_H, barThickness * 1.4]} />
        {barMat}
      </mesh>
    </group>
  );
}
