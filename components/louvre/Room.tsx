"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { makeParquetChevron, makeVelvetWall } from "@/lib/three/textures";
import {
  ROOM_WIDTH,
  ROOM_HEIGHT,
  ROOM_DEPTH,
  WALL_THICKNESS,
  WALL_FRONT_Z,
  NICHE_W,
  NICHE_H,
  NICHE_BOTTOM_Y,
  NICHE_TOP_Y,
  NICHE_RIGHT_X,
} from "./dimensions";
import { WallBox, WallBoxSide } from "./WallPanel";

/**
 * Caja de la sala del Louvre.
 * La pared trasera NO es un box entero: es un marco de 4 paneles alrededor
 * del hueco rectangular (nicho).  Cada panel usa `<WallBox>` que clona la
 * textura y setea `repeat` proporcional a sus dimensiones → tiling consistente.
 */
export function Room() {
  const parquet = useMemo(() => makeParquetChevron(2048), []);
  const velvet = useMemo(() => makeVelvetWall(512), []);

  // Pared trasera con hueco: 4 paneles alrededor del nicho
  const topH = ROOM_HEIGHT - NICHE_TOP_Y;
  const botH = NICHE_BOTTOM_Y;
  const sideW = ROOM_WIDTH / 2 - NICHE_RIGHT_X;
  const backZ = WALL_FRONT_Z - WALL_THICKNESS / 2;

  return (
    <group>
      {/* === Pared trasera: 4 paneles formando un marco alrededor del nicho ===
          Cada panel tiene `uvOffset = (x_start, y_start)` en metros world, así
          las manchas de la textura fluyen continuas entre paneles adyacentes. */}
      <WallBox
        position={[0, NICHE_TOP_Y + topH / 2, backZ]}
        size={[ROOM_WIDTH, topH, WALL_THICKNESS]}
        velvet={velvet}
        uvOffset={[-ROOM_WIDTH / 2, NICHE_TOP_Y]}
      />
      <WallBox
        position={[0, botH / 2, backZ]}
        size={[ROOM_WIDTH, botH, WALL_THICKNESS]}
        velvet={velvet}
        uvOffset={[-ROOM_WIDTH / 2, 0]}
      />
      <WallBox
        position={[-ROOM_WIDTH / 2 + sideW / 2, (NICHE_BOTTOM_Y + NICHE_TOP_Y) / 2, backZ]}
        size={[sideW, NICHE_H, WALL_THICKNESS]}
        velvet={velvet}
        uvOffset={[-ROOM_WIDTH / 2, NICHE_BOTTOM_Y]}
      />
      <WallBox
        position={[ROOM_WIDTH / 2 - sideW / 2, (NICHE_BOTTOM_Y + NICHE_TOP_Y) / 2, backZ]}
        size={[sideW, NICHE_H, WALL_THICKNESS]}
        velvet={velvet}
        uvOffset={[NICHE_RIGHT_X, NICHE_BOTTOM_Y]}
      />

      {/* === Paredes laterales (corren en Z) === */}
      <WallBoxSide
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        depth={ROOM_DEPTH}
        height={ROOM_HEIGHT}
        thickness={WALL_THICKNESS}
        velvet={velvet}
      />
      <WallBoxSide
        position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0]}
        depth={ROOM_DEPTH}
        height={ROOM_HEIGHT}
        thickness={WALL_THICKNESS}
        velvet={velvet}
      />

      {/* === Pared del espectador === */}
      <WallBox
        position={[0, ROOM_HEIGHT / 2, ROOM_DEPTH / 2]}
        size={[ROOM_WIDTH, ROOM_HEIGHT, WALL_THICKNESS]}
        velvet={velvet}
      />

      {/* Techo oscuro */}
      <mesh position={[0, ROOM_HEIGHT, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial color="#0a0d14" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Claraboya */}
      <mesh position={[0, ROOM_HEIGHT - 0.02, -2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 4.5]} />
        <meshBasicMaterial color="#fff1d2" />
      </mesh>

      {/* Piso parquet chevron */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_WIDTH, ROOM_DEPTH]} />
        <meshStandardMaterial map={parquet} roughness={0.58} metalness={0.02} />
      </mesh>

      {/* Rodapié blanco continuo alrededor de TODO el perímetro de la sala */}
      <Skirting />
    </group>
  );
}

function Skirting() {
  const H = 0.14;
  const THICK = 0.04;
  const Y = H / 2;
  const COLOR = "#d4d0c6";
  const ROUGH = 0.85;

  const backOffset = ROOM_DEPTH / 2 - WALL_THICKNESS / 2 - THICK / 2;
  const backZ = -backOffset;
  const frontZ = backOffset;
  const leftX = -(ROOM_WIDTH / 2 - WALL_THICKNESS / 2 - THICK / 2);
  const rightX = -leftX;

  const backSideTramoW = (ROOM_WIDTH - NICHE_W) / 2;
  const backCentralTramoW = NICHE_W;

  return (
    <>
      {/* PARED TRASERA: 3 tramos — izq del nicho, bajo el nicho, der del nicho */}
      <mesh position={[-ROOM_WIDTH / 2 + backSideTramoW / 2, Y, backZ]}>
        <boxGeometry args={[backSideTramoW, H, THICK]} />
        <meshStandardMaterial color={COLOR} roughness={ROUGH} />
      </mesh>
      <mesh position={[0, Y, backZ]}>
        <boxGeometry args={[backCentralTramoW, H, THICK]} />
        <meshStandardMaterial color={COLOR} roughness={ROUGH} />
      </mesh>
      <mesh position={[ROOM_WIDTH / 2 - backSideTramoW / 2, Y, backZ]}>
        <boxGeometry args={[backSideTramoW, H, THICK]} />
        <meshStandardMaterial color={COLOR} roughness={ROUGH} />
      </mesh>

      {/* PAREDES LATERALES — extendidas para cubrir esquinas */}
      <mesh position={[leftX, Y, 0]}>
        <boxGeometry args={[THICK, H, ROOM_DEPTH - WALL_THICKNESS - THICK]} />
        <meshStandardMaterial color={COLOR} roughness={ROUGH} />
      </mesh>
      <mesh position={[rightX, Y, 0]}>
        <boxGeometry args={[THICK, H, ROOM_DEPTH - WALL_THICKNESS - THICK]} />
        <meshStandardMaterial color={COLOR} roughness={ROUGH} />
      </mesh>

      {/* PARED DEL ESPECTADOR */}
      <mesh position={[0, Y, frontZ]}>
        <boxGeometry args={[ROOM_WIDTH - WALL_THICKNESS - THICK, H, THICK]} />
        <meshStandardMaterial color={COLOR} roughness={ROUGH} />
      </mesh>
    </>
  );
}
