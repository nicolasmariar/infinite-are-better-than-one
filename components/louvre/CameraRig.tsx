"use client";

import { OrbitControls } from "@react-three/drei";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { GIOCONDA_Y, GIOCONDA_Z } from "./dimensions";

/**
 * Visitor cam: parado a ~5m del cuadro, altura 1.65m.
 * Orbit controls con límites para no salir de la sala.
 */
export function CameraRig() {
  const isTouch = useMediaQuery("(pointer: coarse)");

  return (
    <OrbitControls
      target={[0, GIOCONDA_Y, GIOCONDA_Z]}
      enablePan={false}
      enableZoom
      enableRotate
      minDistance={1.5}
      maxDistance={9.5}
      minPolarAngle={Math.PI * 0.22}
      maxPolarAngle={Math.PI * 0.55}
      minAzimuthAngle={-Math.PI * 0.35}
      maxAzimuthAngle={Math.PI * 0.35}
      zoomSpeed={isTouch ? 0.7 : 0.9}
      rotateSpeed={isTouch ? 0.5 : 0.7}
      dampingFactor={0.08}
      enableDamping
    />
  );
}
