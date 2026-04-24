"use client";

import { useEffect, useState } from "react";

/**
 * Hook reactivo para media queries. Devuelve `false` en el render inicial
 * del servidor y en el primer render del cliente (evita hydration mismatch).
 *
 * Ejemplo:
 *   const isMobile = useMediaQuery("(max-width: 768px)");
 *   const isTouch = useMediaQuery("(pointer: coarse)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
