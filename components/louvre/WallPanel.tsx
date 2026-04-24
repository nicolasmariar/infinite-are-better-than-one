"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Panel de pared con textura escalada según su tamaño real.
 *
 * Las texturas del `makeVelvetWall` se clonan por mesh y se setea `repeat`
 * proporcional a (width, height) en metros → tiling consistente entre paneles
 * de distinto tamaño (la textura cubre WORLD_SCALE metros por ciclo en todos lados).
 */

const WORLD_SCALE = 2.5; // metros por ciclo de la textura
const NORMAL_SCALE = 0.7; // densidad de repeat del normal map (manda más frecuencia fina)

export type WallTextures = {
  map: THREE.Texture;
  normalMap: THREE.Texture;
};

/**
 * Clona el map + normalMap y les setea repeat = size/WORLD_SCALE.
 * Si `uvOffset` se provee, se usa como offset en espacio-mundo (en metros). Eso
 * hace que paneles adyacentes tengan tiling CONTINUO — los bordes de la textura
 * coinciden. Si no se provee, usa offset aleatorio para independizar el panel.
 */
function useScaledTextures(
  width: number,
  height: number,
  src: WallTextures,
  uvOffset?: [number, number], // [metros en x, metros en y]
) {
  const offsetKey = uvOffset ? `${uvOffset[0]},${uvOffset[1]}` : "random";
  return useMemo(() => {
    const map = src.map.clone();
    map.needsUpdate = true;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(width / WORLD_SCALE, height / WORLD_SCALE);
    if (uvOffset) {
      map.offset.set(uvOffset[0] / WORLD_SCALE, uvOffset[1] / WORLD_SCALE);
    } else {
      map.offset.set(Math.random(), Math.random());
    }

    const normalMap = src.normalMap.clone();
    normalMap.needsUpdate = true;
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(width / (WORLD_SCALE * NORMAL_SCALE), height / (WORLD_SCALE * NORMAL_SCALE));
    normalMap.offset.copy(map.offset);

    return { map, normalMap };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, src, offsetKey]);
}

/**
 * Box de pared con grosor (para la pared trasera — los 4 paneles alrededor del nicho
 * y la pared frontal del espectador).
 */
export function WallBox({
  position,
  size,
  velvet,
  receiveShadow = true,
  uvOffset,
}: {
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
  velvet: WallTextures;
  receiveShadow?: boolean;
  /** Offset en metros en (x,y) del mundo — para tiling continuo entre paneles. */
  uvOffset?: [number, number];
}) {
  const [w, h, d] = size;
  const { map, normalMap } = useScaledTextures(w, h, velvet, uvOffset);
  return (
    <mesh position={position} receiveShadow={receiveShadow}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.15, 0.15)}
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>
  );
}

/**
 * Box de pared LATERAL (corre a lo largo del eje Z). W = depth del mesh,
 * H = height. Grosor en X.
 */
export function WallBoxSide({
  position,
  depth,
  height,
  thickness,
  velvet,
  receiveShadow = true,
}: {
  position: [number, number, number];
  depth: number;
  height: number;
  thickness: number;
  velvet: WallTextures;
  receiveShadow?: boolean;
}) {
  const { map, normalMap } = useScaledTextures(depth, height, velvet);
  return (
    <mesh position={position} receiveShadow={receiveShadow}>
      <boxGeometry args={[thickness, height, depth]} />
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.15, 0.15)}
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>
  );
}

/**
 * Plane con textura escalada (para las paredes internas del nicho).
 */
export function WallPlane({
  position,
  size,
  rotation = [0, 0, 0],
  velvet,
  receiveShadow = true,
  uvOffset,
}: {
  position: [number, number, number];
  size: [number, number]; // width, height
  rotation?: [number, number, number];
  velvet: WallTextures;
  receiveShadow?: boolean;
  uvOffset?: [number, number];
}) {
  const { map, normalMap } = useScaledTextures(size[0], size[1], velvet, uvOffset);
  return (
    <mesh position={position} rotation={rotation} receiveShadow={receiveShadow}>
      <planeGeometry args={size} />
      <meshStandardMaterial
        map={map}
        normalMap={normalMap}
        normalScale={new THREE.Vector2(0.15, 0.15)}
        roughness={0.95}
        metalness={0.02}
      />
    </mesh>
  );
}
