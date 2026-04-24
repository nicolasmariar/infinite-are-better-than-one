import * as THREE from "three";

/**
 * Conjunto de texturas procedurales generadas con Canvas 2D:
 *  - parquet chevron claro (roble)
 *  - madera melamina clara (tarima)
 *  - pared velvet azul-grafito (noise + bumpMap)
 */

function randSeeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

export function makeParquetChevron(size = 2048): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = randSeeded(42);

  // Base cálida
  ctx.fillStyle = "#bc9363";
  ctx.fillRect(0, 0, size, size);

  // Parquet de tablones rectos horizontales alargados (mismo look que el cajón de melamina).
  // Tablones de ~30cm alto × 1.20m largo con juntas sutiles.
  const plankH = size / 16; // ~6.25% de la textura = ~30cm en world-space
  const plankL = size / 4; // largos

  const palette = [
    "#c9a071",
    "#c49866",
    "#bb8e5c",
    "#d0a87a",
    "#b58a5c",
    "#c29a6a",
  ];

  // Desplazamiento aleatorio entre filas para que las juntas no coincidan (tipo brick)
  for (let row = 0; row < size / plankH + 1; row++) {
    const rowOffset = (rand() * plankL) | 0; // shift aleatorio
    for (let col = -1; col < size / plankL + 2; col++) {
      const x = col * plankL - rowOffset;
      const y = row * plankH;
      const color = palette[Math.floor(rand() * palette.length)];

      ctx.fillStyle = color;
      ctx.fillRect(x, y, plankL - 1, plankH - 1); // -1 para dejar junta sutil

      // Vetas sutiles
      ctx.strokeStyle = "rgba(60,40,18,0.14)";
      ctx.lineWidth = 0.8;
      const vetas = 4 + Math.floor(rand() * 3);
      for (let v = 0; v < vetas; v++) {
        ctx.beginPath();
        const vy = y + (v / vetas) * plankH + rand() * 2;
        ctx.moveTo(x + rand() * 4, vy);
        // veta ondulada
        for (let xx = 0; xx <= plankL; xx += plankL / 8) {
          ctx.lineTo(x + xx, vy + (rand() - 0.5) * 1.5);
        }
        ctx.stroke();
      }

      // Nudo ocasional
      if (rand() < 0.04) {
        const nx = x + rand() * plankL;
        const ny = y + rand() * plankH;
        const rr = 2 + rand() * 4;
        const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, rr * 2.5);
        grad.addColorStop(0, "rgba(50,28,12,0.55)");
        grad.addColorStop(1, "rgba(50,28,12,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(nx, ny, rr * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Glaze muy suave
  const glaze = ctx.createLinearGradient(0, 0, size, size);
  glaze.addColorStop(0, "rgba(255,238,210,0.05)");
  glaze.addColorStop(1, "rgba(70,45,22,0.07)");
  ctx.fillStyle = glaze;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1.5);
  tex.anisotropy = 16;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Madera melamina clara con vetas horizontales — para tarima y banco.
 */
export function makeWoodMelamine(size = 1024): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rand = randSeeded(7);

  // Base cálida clara
  const base = ctx.createLinearGradient(0, 0, size, 0);
  base.addColorStop(0, "#d6ae7c");
  base.addColorStop(0.5, "#c9a071");
  base.addColorStop(1, "#b88b5c");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Vetas horizontales largas
  for (let i = 0; i < 220; i++) {
    const y = rand() * size;
    const opacity = 0.08 + rand() * 0.18;
    const shade = Math.floor(40 + rand() * 40);
    ctx.strokeStyle = `rgba(${shade},${shade - 8},${shade - 22},${opacity})`;
    ctx.lineWidth = 0.6 + rand() * 1.6;
    ctx.beginPath();
    ctx.moveTo(0, y);
    let cx = size / 2;
    let cy = y + (rand() - 0.5) * 4;
    ctx.quadraticCurveTo(cx, cy, size, y + (rand() - 0.5) * 6);
    ctx.stroke();
  }

  // Nudos ocasionales
  for (let i = 0; i < 6; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 3 + rand() * 8;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    grad.addColorStop(0, "rgba(40,25,12,0.5)");
    grad.addColorStop(1, "rgba(40,25,12,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 3, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Pared tipo estuco/yeso azul-grafito mate.
 *
 * Objetivo: look casi-uniforme (sin patrón visible) con micro-relieve de velvet.
 * Clave: hacemos el color casi sólido, y toda la "textura" viene del normalMap
 * de alta frecuencia. Así el tiling entre paneles es invisible porque el mapa
 * de color no tiene rasgos distintivos que alinear.
 *
 * Devuelve { map, normalMap } seamless (tileable).
 */
export function makeVelvetWall(size = 512): { map: THREE.Texture; normalMap: THREE.Texture } {
  // === COLOR MAP: casi uniforme, micro-variación imperceptible ===
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base azul grafito un poco más claro
  const BASE = { r: 46, g: 58, b: 78 }; // #2e3a4e — azul medio-oscuro
  ctx.fillStyle = `rgb(${BASE.r},${BASE.g},${BASE.b})`;
  ctx.fillRect(0, 0, size, size);

  // Noise de variación + manchas más marcadas (mezcla value noise de 3 octavas).
  // Aporta contraste visible sin llegar a pixelado duro.
  const blobField = makeValueNoise2D(size, [4, 16, 64], [0.55, 0.3, 0.15]);
  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // manchas grandes (shade -12..+12)
      const blob = (blobField[y * size + x] - 0.5) * 22;
      // grain fino (±3)
      const grain = (Math.random() - 0.5) * 6;
      const total = blob + grain;
      d[i] = Math.max(0, Math.min(255, d[i] + total));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + total));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + total * 1.15));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const map = new THREE.CanvasTexture(canvas);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = 16;
  map.colorSpace = THREE.SRGBColorSpace;
  // repeat por defecto 1,1 — cada mesh la reescala según su tamaño real
  map.repeat.set(1, 1);

  // === NORMAL MAP: grano fino tipo estuco con suavizado (value noise 2-oct) ===
  const nSize = size;
  const nCanvas = document.createElement("canvas");
  nCanvas.width = nCanvas.height = nSize;
  const nCtx = nCanvas.getContext("2d")!;
  const heightField = makeValueNoise2D(nSize, [8, 32], [0.7, 0.3]);

  // Convertir heightField a normal map via diferenciación central (Sobel-lite)
  const normalImg = nCtx.createImageData(nSize, nSize);
  const nd = normalImg.data;
  const strength = 1.2;
  for (let y = 0; y < nSize; y++) {
    for (let x = 0; x < nSize; x++) {
      const xL = (x - 1 + nSize) % nSize;
      const xR = (x + 1) % nSize;
      const yU = (y - 1 + nSize) % nSize;
      const yD = (y + 1) % nSize;
      const hL = heightField[y * nSize + xL];
      const hR = heightField[y * nSize + xR];
      const hU = heightField[yU * nSize + x];
      const hD = heightField[yD * nSize + x];
      const dx = (hR - hL) * strength;
      const dy = (hD - hU) * strength;
      // normal (−dx, −dy, 1) normalizado → a [0,255]
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const nx = -dx / len;
      const ny = -dy / len;
      const nz = 1 / len;
      const i = (y * nSize + x) * 4;
      nd[i] = Math.floor((nx * 0.5 + 0.5) * 255);
      nd[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      nd[i + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      nd[i + 3] = 255;
    }
  }
  nCtx.putImageData(normalImg, 0, 0);

  const normalMap = new THREE.CanvasTexture(nCanvas);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.anisotropy = 16;
  normalMap.repeat.set(4, 4);

  return { map, normalMap };
}

/**
 * Value noise 2D tileable con octavas: genera un campo [0..1] de tamaño size×size
 * mezclando celdas random + interpolación coseno. Las celdas se tildean con módulo
 * para que los bordes opuestos coincidan (textura seamless).
 */
function makeValueNoise2D(size: number, frequencies: number[], amplitudes: number[]): Float32Array {
  const field = new Float32Array(size * size);
  const rand = randSeeded(7331);

  for (let o = 0; o < frequencies.length; o++) {
    const freq = frequencies[o];
    const amp = amplitudes[o];
    // grid de valores random (freq × freq), tileable
    const grid = new Float32Array(freq * freq);
    for (let i = 0; i < grid.length; i++) grid[i] = rand();

    const cellSize = size / freq;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const gx = x / cellSize;
        const gy = y / cellSize;
        const ix = Math.floor(gx);
        const iy = Math.floor(gy);
        const fx = gx - ix;
        const fy = gy - iy;
        const ix0 = ix % freq;
        const iy0 = iy % freq;
        const ix1 = (ix + 1) % freq;
        const iy1 = (iy + 1) % freq;
        const v00 = grid[iy0 * freq + ix0];
        const v10 = grid[iy0 * freq + ix1];
        const v01 = grid[iy1 * freq + ix0];
        const v11 = grid[iy1 * freq + ix1];
        // cosine interp
        const ux = (1 - Math.cos(fx * Math.PI)) * 0.5;
        const uy = (1 - Math.cos(fy * Math.PI)) * 0.5;
        const a = v00 * (1 - ux) + v10 * ux;
        const b = v01 * (1 - ux) + v11 * ux;
        field[y * size + x] += (a * (1 - uy) + b * uy) * amp;
      }
    }
  }

  return field;
}
