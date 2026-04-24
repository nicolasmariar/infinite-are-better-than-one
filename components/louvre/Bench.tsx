"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { makeWoodMelamine } from "@/lib/three/textures";
import { WALL_FRONT_Z, NICHE_BOTTOM_Y } from "./dimensions";

/**
 * Barrera / banco del Louvre: semicírculo pequeño ENFRENTE del cuadro.
 * Sus dos extremos tocan la pared trasera a ambos lados del nicho, flanqueando
 * la Gioconda. El arco se abre hacia el visitante formando un "perímetro de seguridad".
 *
 * Una sola ExtrudeGeometry siguiendo una curva cuadrática. 2 patas cilíndricas
 * cromadas equidistantes del centro.
 */
export function Bench() {
  const wood = useMemo(() => makeWoodMelamine(1024), []);

  // Tope del banco al mismo nivel que el tope del cajón (y = NICHE_BOTTOM_Y = 1.05)
  // Asiento del mismo grosor que el cajón (0.26 m). Patas largas que llevan el
  // conjunto desde el piso hasta la base del asiento.
  const TOP_Y = NICHE_BOTTOM_Y; // 1.05
  const SEAT_T = 0.13; // grosor del asiento (mitad del alto del cajón)
  const SEAT_W = 0.28; // ancho transversal (tira delgada — radio interno mayor)
  const SEAT_CENTER_Y = TOP_Y - SEAT_T / 2; // 0.92
  const LEG_H = TOP_Y - SEAT_T; // 0.79 m — patas largas

  // Semicírculo más compacto (arco más corto) pero con asiento más ancho.
  const R = 2.6; // radio del arco (más chico)
  const CENTER_Z = WALL_FRONT_Z + 0.03;

  const curve = useMemo(() => {
    const POINTS = 48;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= POINTS; i++) {
      const t = i / POINTS;
      // α va de π a 0: comienza en (-R, 0) y termina en (+R, 0), pasando por (0, +R)
      const alpha = Math.PI - t * Math.PI;
      const x = R * Math.cos(alpha);
      const z = CENTER_Z + R * Math.sin(alpha);
      pts.push(new THREE.Vector3(x, 0, z));
    }
    return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
  }, [R, CENTER_Z]);

  // Shape 2D: rectángulo de la sección transversal del banco.
  // Con FrenetFrames + curva horizontal, el eje X del shape se mapea a la
  // VERTICAL del mundo, y el eje Y del shape al ancho horizontal transversal.
  // Así SEAT_T (0.13) controla la ALTURA real del banco y SEAT_W (0.55) el ancho.
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-SEAT_T / 2, -SEAT_W / 2);
    s.lineTo(SEAT_T / 2, -SEAT_W / 2);
    s.lineTo(SEAT_T / 2, SEAT_W / 2);
    s.lineTo(-SEAT_T / 2, SEAT_W / 2);
    s.closePath();
    return s;
  }, []);

  // Posiciones de las 2 patas: equidistantes del centro, en puntos de la curva
  const legPositions = useMemo(() => {
    // t=0.25 da aprox x=-3.5, z variable
    // t=0.75 da aprox x=+3.5, z variable
    const p1 = curve.getPointAt(0.25);
    const p2 = curve.getPointAt(0.75);
    return [p1, p2];
  }, [curve]);

  return (
    <group>
      {/* ASIENTO: una sola ExtrudeGeometry siguiendo la curva, centrado en SEAT_CENTER_Y */}
      <group position={[0, SEAT_CENTER_Y, 0]}>
        <mesh castShadow receiveShadow>
          <extrudeGeometry
            args={[
              shape,
              {
                extrudePath: curve,
                steps: 120,
                bevelEnabled: false,
              },
            ]}
          />
          <meshStandardMaterial map={wood} roughness={0.4} metalness={0.06} />
        </mesh>
      </group>

      {/* 2 PATAS CILÍNDRICAS cromadas, equidistantes del centro */}
      {legPositions.map((p, i) => (
        <mesh key={i} position={[p.x, LEG_H / 2, p.z]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, LEG_H, 16]} />
          <meshStandardMaterial color="#a9acb1" roughness={0.22} metalness={0.95} />
        </mesh>
      ))}
    </group>
  );
}
