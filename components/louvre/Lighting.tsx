"use client";

import { Environment } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Iluminación museo:
 *  - Claraboya cenital cálida que baña pared trasera y cuadro
 *  - 2 spots laterales enfocados sobre la Gioconda
 *  - Ambient sutil para evitar sombras negras absolutas
 *  - Environment IBL "apartment" para reflejos del marco dorado y vidrio
 */
export function Lighting({ lowQuality = false }: { lowQuality?: boolean }) {
  const spotL = useRef<THREE.SpotLight>(null);
  const spotR = useRef<THREE.SpotLight>(null);
  const skylight = useRef<THREE.DirectionalLight>(null);

  // En mobile usamos shadow maps más chicos (1024 vs 2048 / 512 vs 1024)
  const skyShadow = lowQuality ? 1024 : 2048;
  const spotShadow = lowQuality ? 512 : 1024;

  useEffect(() => {
    if (spotL.current) {
      spotL.current.target.position.set(0, 2.0, -5.9);
      spotL.current.target.updateMatrixWorld();
    }
    if (spotR.current) {
      spotR.current.target.position.set(0, 2.0, -5.9);
      spotR.current.target.updateMatrixWorld();
    }
    if (skylight.current) {
      skylight.current.target.position.set(0, 2.5, -5.9);
      skylight.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <ambientLight intensity={0.25} color="#bec2cc" />

      {/* Claraboya (directional cenital cálido) */}
      <directionalLight
        ref={skylight}
        position={[0, 5.4, -2.5]}
        intensity={1.1}
        color="#fff1d2"
        castShadow={!lowQuality}
        shadow-mapSize-width={skyShadow}
        shadow-mapSize-height={skyShadow}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={6}
        shadow-camera-bottom={-2}
        shadow-bias={-0.0004}
      />

      {/* Spot izquierdo sobre el cuadro */}
      <spotLight
        ref={spotL}
        position={[-1.6, 4.6, -3.5]}
        intensity={14}
        angle={Math.PI / 7}
        penumbra={0.6}
        decay={1.5}
        distance={10}
        color="#ffe9bf"
        castShadow={!lowQuality}
        shadow-mapSize-width={spotShadow}
        shadow-mapSize-height={spotShadow}
      />

      {/* Spot derecho sobre el cuadro */}
      <spotLight
        ref={spotR}
        position={[1.6, 4.6, -3.5]}
        intensity={14}
        angle={Math.PI / 7}
        penumbra={0.6}
        decay={1.5}
        distance={10}
        color="#ffe9bf"
        castShadow={!lowQuality}
        shadow-mapSize-width={spotShadow}
        shadow-mapSize-height={spotShadow}
      />

      {/* Fill desde el piso (bounce warm) */}
      <pointLight position={[0, 0.4, -2]} intensity={0.4} color="#d9b082" distance={6} decay={2} />

      {/*
       * PERF OPTION A (opcional, no aplicada):
       * `Environment preset="apartment"` baja un HDR (~1 MB) desde
       * raw.githack.com/pmndrs/drei-assets, lo que agrega latencia de
       * third-party + bytes extra en la primera carga. Usamos `environmentIntensity={0.35}`
       * para reflejos sutiles en el marco dorado.
       *
       * Si querés aplicar la optimización:
       *   1. Remover o condicionar: `{!lowQuality && <Environment ... />}` para
       *      que solo desktop cargue el HDR.
       *   2. Opcional reemplazo: embeber un cubemap local chico (32×32 PNG × 6 caras,
       *      ~5 KB total) en `public/env/` y pasarlo a `<Environment files={[...]}/>`.
       *   3. Costo visual: menos reflejos en metales (marco, vidrio), escena
       *      se ve un poco más "plana". El spot + directional siguen funcionando.
       */}
      <Environment preset="apartment" environmentIntensity={0.35} />
    </>
  );
}
