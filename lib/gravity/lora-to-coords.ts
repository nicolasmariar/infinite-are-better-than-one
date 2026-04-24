/**
 * Algoritmo de posicionamiento 3D para la nube Interstellar.
 *
 * Cada LoRA entrenada (12 en total) define un ancla en una esfera (distribución
 * Fibonacci para máxima separación angular entre ellas). Cada Gioconda se
 * ubica en el centro de masas de las anclas de las LoRAs activas, ponderado
 * por el peso de cada LoRA.
 *
 * Resultado: Giocondas "puras" quedan cerca del ancla de su estilo; las mixtas
 * flotan entre anclas, más cerca del LoRA con mayor peso.
 */
import type { LoraWeight } from "@/lib/supabase/types";

export type Vec3 = { x: number; y: number; z: number };

const RADIUS = 100;

/**
 * Distribución Fibonacci sphere: N puntos igualmente espaciados en la superficie
 * de una esfera. Mucho mejor que grid lat/lon porque evita concentración en polos.
 */
export function fibonacciSphere(n: number, radius: number = RADIUS): Vec3[] {
  const points: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;                   // -1 a 1
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
    });
  }
  return points;
}

/** Orden canónico de las 12 LoRAs — el índice define la posición en la esfera. */
export const STYLE_ORDER: readonly string[] = [
  "Quinquela_AI_v2",
  "XulSolar_AI_SD15",
  "Berni_AI",
  "Forner_AI",
  "Fini_AI",
  "DeLaCarcova_AI",
  "LeParc_AI",
  "Minujin_AI_Flux",
  "Casares_AI",
  "ElEternauta_AI",
  "DisenoIndigena_AI",
  "NoMa_AI",
] as const;

export const STYLE_ANCHORS: Record<string, Vec3> = (() => {
  const points = fibonacciSphere(STYLE_ORDER.length);
  const map: Record<string, Vec3> = {};
  STYLE_ORDER.forEach((name, i) => {
    map[name] = points[i];
  });
  return map;
})();

/**
 * Calcula la posición 3D de una Gioconda dado su vector de LoRAs ponderado.
 *
 * Si no tiene LoRAs (metadata ausente), se coloca en el origen con jitter sutil
 * para que no colisionen todas.
 */
export function loraToCoords(
  loras: LoraWeight[] | null | undefined,
  jitterSeed: number = 0,
): Vec3 {
  if (!loras || loras.length === 0) {
    return jitter({ x: 0, y: 0, z: 0 }, jitterSeed, 10);
  }

  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  let totalWeight = 0;

  for (const { name, weight } of loras) {
    const anchor = STYLE_ANCHORS[name];
    if (!anchor) continue; // LoRA desconocida, ignorar
    const w = Math.max(0, weight); // pesos negativos no contribuyen
    sumX += anchor.x * w;
    sumY += anchor.y * w;
    sumZ += anchor.z * w;
    totalWeight += w;
  }

  if (totalWeight === 0) {
    return jitter({ x: 0, y: 0, z: 0 }, jitterSeed, 10);
  }

  const centerOfMass: Vec3 = {
    x: sumX / totalWeight,
    y: sumY / totalWeight,
    z: sumZ / totalWeight,
  };

  // Jitter sutil (<= 2 unidades) para evitar superposición exacta de Giocondas
  // con mismo vector LoRA (ej: mismas anclas, distintos seeds).
  return jitter(centerOfMass, jitterSeed, 2);
}

/** Deterministic jitter pseudo-aleatorio basado en seed (para que no cambie entre renders). */
function jitter(p: Vec3, seed: number, amount: number): Vec3 {
  const r1 = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
  const r2 = (Math.sin(seed * 78.233) * 43758.5453) % 1;
  const r3 = (Math.sin(seed * 39.4321) * 43758.5453) % 1;
  return {
    x: p.x + (r1 - 0.5) * amount * 2,
    y: p.y + (r2 - 0.5) * amount * 2,
    z: p.z + (r3 - 0.5) * amount * 2,
  };
}
