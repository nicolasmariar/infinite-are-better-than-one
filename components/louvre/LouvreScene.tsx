"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { Room } from "./Room";
import { Vitrine } from "./Vitrine";
import { Bench } from "./Bench";
import { GiocondaFrame } from "./GiocondaFrame";
import { CameraRig } from "./CameraRig";
import { Lighting } from "./Lighting";
import { GIOCONDA_Y, GIOCONDA_Z } from "./dimensions";

export function LouvreScene({
  giocondaUrls,
  cycleDuration = 60,
}: {
  giocondaUrls: string[];
  cycleDuration?: number;
}) {
  return (
    <div className="fixed inset-0 bg-[#0a0d13]">
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: [0, 1.65, 1.5], fov: 55, near: 0.05, far: 80 }}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <color attach="background" args={["#0a0d13"]} />

        <Suspense fallback={null}>
          <Lighting />
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
