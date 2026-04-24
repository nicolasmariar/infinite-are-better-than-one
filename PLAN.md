# infinitearebetterthanone.com — Plan de arquitectura

> *Fase 2 del proyecto "Infinite are better than one" — app web que continúa la obra instalativa como experiencia digital*

## Contexto

Obra original: 43.469+ imágenes de la Gioconda generadas con 12 modelos de IA entrenados con estilos argentinos. Premio Pueyrredón de Artes Visuales 2025. La obra continúa generándose (1 Gioconda nueva cada 5 min vía ComfyUI/n8n en fase 3).

**Objetivo de la web**: traducir la experiencia museística al navegador. Un usuario llega y se encuentra parado en la sala del Louvre (reconstrucción 3D fiel), pero la única obra expuesta es una Gioconda que cambia cada minuto. Se puede caminar, acercarse, ver detalles, descargar la favorita. En una vista secundaria, un mapa 3D tipo *Interstellar* muestra TODAS las Giocondas ordenadas por influencia estilística (atracción gravitacional según pesos LoRA).

## Stack

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Framework | **Next.js 15 (App Router) + TypeScript** | Mejor SEO en React; metadata API nativa; ISR para nuevas Giocondas; `next/image` crítico con 43k imágenes |
| 3D | **React Three Fiber + drei + postprocessing** | API declarativa sobre Three.js; maduro; mejor DX |
| Estilos | Tailwind CSS | Rápido, pequeño bundle, familiar |
| Storage imágenes | **Cloudflare R2 + CDN** | $0.015/GB/mes, SIN egress fees, CDN global |
| DB metadata | **Supabase (PostgreSQL)** | Free tier 500MB, auth incluido si lo necesitamos, buenas dashboards |
| Deploy | **Vercel** | 1-click desde GitHub, ISR nativo, Edge Functions |
| Dominio | Namecheap → Vercel | DNS apunta a Vercel, CNAME `cdn` → R2 |
| Repo | GitHub | Fuente de verdad |
| Analytics | Vercel Analytics + Cloudflare Analytics | Gratis, sin cookies |
| SEO testing | Lighthouse, Google Search Console | Target: 100 Performance, 100 SEO |

## Estructura del repo

```
infinitearebetterthanone/
├── app/
│   ├── layout.tsx                   # metadata global, viewport, fonts
│   ├── page.tsx                     # Landing: la sala Louvre 3D (SSG)
│   ├── sitemap.ts                   # genera sitemap.xml dinámico
│   ├── robots.ts                    # genera robots.txt
│   ├── opengraph-image.tsx          # OG image dinámica por ruta
│   ├── giocondas/
│   │   ├── page.tsx                 # Mapa 3D Interstellar
│   │   └── [id]/
│   │       ├── page.tsx             # Página individual (SSG + ISR)
│   │       └── opengraph-image.tsx  # OG image de cada Gioconda
│   ├── about/
│   │   └── page.tsx                 # contexto del proyecto, tesis, Nicolás
│   └── api/
│       ├── giocondas/
│       │   ├── route.ts             # GET list (paginado, filtros)
│       │   └── [id]/
│       │       ├── route.ts         # GET detalle
│       │       └── download/route.ts # GET archivo + tracking
│       └── revalidate/route.ts      # webhook para ISR (fase 3)
├── components/
│   ├── louvre/
│   │   ├── LouvreScene.tsx          # Canvas R3F
│   │   ├── Room.tsx                 # Caja de la sala
│   │   ├── Wall.tsx                 # Pared azul grafito (#2a3442)
│   │   ├── Floor.tsx                # Parquet chevron
│   │   ├── Ceiling.tsx              # Techo + claraboya
│   │   ├── Bench.tsx                # Banco curvo roble
│   │   ├── GiocondaFrame.tsx        # Marco dorado + vidrio templado
│   │   ├── GiocondaCycler.tsx       # Lógica de rotación 1/min
│   │   ├── Lighting.tsx             # Luz cenital + spot cuadro
│   │   └── CameraControls.tsx       # FPS/orbit, zoom a detalle
│   ├── interstellar/
│   │   ├── InterstellarScene.tsx
│   │   ├── GiocondaPoint.tsx        # instanced sprite con thumbnail
│   │   ├── gravityLayout.ts         # algoritmo LoRA → xyz
│   │   └── PointHoverDetail.tsx
│   ├── ui/
│   │   ├── DownloadButton.tsx
│   │   ├── MetadataPanel.tsx        # prompt + LoRAs + seed
│   │   ├── NavMenu.tsx
│   │   └── Loading.tsx              # fallback mientras carga
│   └── seo/
│       ├── StructuredData.tsx       # JSON-LD tipo VisualArtwork
│       └── Breadcrumbs.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # browser
│   │   ├── server.ts                # RSC
│   │   └── types.ts                 # types generados
│   ├── r2/
│   │   └── urls.ts                  # helpers para URL de CDN
│   ├── gravity/
│   │   └── lora-to-coords.ts        # matemática de posicionamiento
│   └── seo/
│       ├── metadata.ts              # helpers de Metadata API
│       └── jsonld.ts
├── scripts/                         # one-off scripts (no parte del build)
│   ├── 01-extract-metadata.py       # lee PNG/JPG, parsea prompt+LoRAs
│   ├── 02-generate-thumbnails.py    # 256px webp
│   ├── 03-upload-to-r2.py           # sube todo a R2
│   └── 04-seed-supabase.py          # inserta rows en DB
├── public/
│   ├── textures/                    # PBR de sala (pared, piso, banco)
│   ├── models/                      # .glb del marco, banco
│   ├── favicon.ico
│   └── og-default.png
├── .env.local                       # R2 + Supabase keys
├── .env.example
├── .gitignore
├── next.config.ts                   # remotePatterns R2, image formats
├── tsconfig.json
├── tailwind.config.ts
├── package.json
└── README.md
```

## Base de datos (Supabase)

```sql
-- Tabla principal
CREATE TABLE giocondas (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,       -- 'Giocondas (123).png'
  slug TEXT NOT NULL UNIQUE,           -- 'gioconda-123' para URLs
  format TEXT NOT NULL,                -- 'png' | 'jpg'
  width INT NOT NULL,
  height INT NOT NULL,
  file_size_bytes BIGINT,

  -- Metadata de generación
  prompt TEXT,
  negative_prompt TEXT,
  model_base TEXT,                     -- 'sd15' | 'sdxl' | 'flux'
  model_checkpoint TEXT,
  seed BIGINT,
  steps INT,
  cfg_scale FLOAT,
  sampler TEXT,

  -- LoRAs con pesos (clave para el Interstellar)
  loras JSONB,                         -- [{"name": "Quinquela_AI_v2", "weight": 0.9}]
  primary_style TEXT,                  -- el de mayor peso
  is_mixed BOOLEAN DEFAULT FALSE,      -- true si >1 LoRA activa

  -- Coords calculadas para el mapa 3D
  coord_x FLOAT,
  coord_y FLOAT,
  coord_z FLOAT,

  -- Tracking
  view_count INT DEFAULT 0,
  download_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  source TEXT DEFAULT 'batch_original' -- 'batch_original' | 'ai_generated_live'
);

CREATE INDEX idx_giocondas_slug ON giocondas(slug);
CREATE INDEX idx_giocondas_primary_style ON giocondas(primary_style);
CREATE INDEX idx_giocondas_is_mixed ON giocondas(is_mixed);
CREATE INDEX idx_giocondas_loras_gin ON giocondas USING GIN (loras);

-- Tracking de descargas (analytics)
CREATE TABLE downloads (
  id SERIAL PRIMARY KEY,
  gioconda_id INT REFERENCES giocondas(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT
);

CREATE INDEX idx_downloads_gioconda_id ON downloads(gioconda_id);

-- Configuración del sitio (un único row)
CREATE TABLE site_config (
  id INT PRIMARY KEY DEFAULT 1,
  cycle_duration_seconds INT DEFAULT 60,
  visible_giocondas_count INT DEFAULT 43469,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

## Algoritmo de posicionamiento 3D (Interstellar)

Cada Gioconda tiene un vector de pesos `[w_quinquela, w_xul, w_berni, w_forner, w_fini, w_carcova, w_leparc, w_minujin, w_casares, w_eternauta, w_indigena, w_noma]`.

**12 anclas** distribuidas en una esfera (Fibonacci sphere):
```
ancla[i].position = fibonacci_sphere_point(i, 12)  // radio = 100
```

**Posición de cada Gioconda**:
```
pos = Σ(ancla[i].position × w[i]) / Σ(w[i])
```

Si una Gioconda tiene solo Quinquela con peso 0.9 → queda en el ancla Quinquela. Si tiene Quinquela 0.6 + Xul 0.3 → queda entre ambos, más cerca de Quinquela.

**Jitter aleatorio sutil** (distancia ≤ 2 unidades) para evitar que Giocondas idénticas en LoRA queden exactamente superpuestas.

**Centro de esfera vacío** actúa como visualización: cuanto más fuera del centro, más "pura" estilísticamente; cuanto más cerca del centro, más mezclada.

## Extracción de metadata

Los PNG generados por AUTOMATIC1111 / ComfyUI / Forge embeben metadata en el chunk `tEXt` o `parameters`. Formato típico:

```
Steps: 30, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1402954088,
Size: 512x768, Model hash: abc123, Model: realisticVisionV51_v51VAE,
<lora:Quinquela_AI_v2:0.9>
```

Script Python (`scripts/01-extract-metadata.py`) parsea:
- Prompt completo (detecta tags `<lora:nombre:peso>` y los extrae a array)
- Prompt negativo
- Sampler, seed, cfg, steps, tamaño
- Modelo base

Para JPGs (si tienen EXIF con esta info): extrae con PIL + piexif.
Si no hay metadata: marcar como `metadata_extracted = false` (null).

Output: `scripts/metadata.jsonl` con una línea por imagen.

## Rutas

- `/` — Landing: sala Louvre 3D (SSG + pre-rendered snapshot para Googlebot).
- `/giocondas` — Mapa Interstellar 3D (SSG).
- `/giocondas/[id]` — Gioconda individual: imagen alta resolución + metadata + prompt + LoRAs + descarga (SSG + ISR 1h).
- `/about` — El proyecto, la tesis, Nicolás, Premio Pueyrredón, enlaces.
- `/download-all` (opcional, fase 3) — ZIP de batch.
- `/api/giocondas` — GET paginado, filtros por estilo/mixed.
- `/api/giocondas/[id]` — GET detalle JSON.
- `/api/giocondas/[id]/download` — 302 redirect a URL firmada de R2 + tracking.

## SEO

Por página de Gioconda (`/giocondas/[id]`):
```tsx
export async function generateMetadata({ params }) {
  const g = await getGiocondaById(params.id);
  return {
    title: `Gioconda #${g.id} — ${g.primary_style} style | infinitearebetterthanone`,
    description: `Mona Lisa reinterpreted in the style of ${g.primary_style_full_name}. AI-generated from a dataset of ${TOTAL}+ unique Giocondas, Nicolás Ruarte (Premio Pueyrredón 2025).`,
    openGraph: { images: [r2url(g.id, 'medium')] },
    alternates: { canonical: `https://infinitearebetterthanone.com/giocondas/${g.id}` },
  };
}
```

JSON-LD tipo `VisualArtwork`:
```json
{
  "@context": "https://schema.org",
  "@type": "VisualArtwork",
  "name": "Gioconda #123",
  "artform": "Digital painting (AI-generated)",
  "creator": { "@type": "Person", "name": "Nicolás Ruarte" },
  "dateCreated": "2025-...",
  "isBasedOn": { "@type": "VisualArtwork", "name": "Mona Lisa", "creator": "Leonardo da Vinci" },
  "artMedium": "Stable Diffusion + LoRA",
  "keywords": ["Quinquela", "Mona Lisa", "generative art", "Argentine artists"]
}
```

Sitemap genera URL por Gioconda → 43.469+ URLs indexables.
Robots.txt permite todos los bots, bloquea `/api/` y `/_next/`.

## Fases

### Fase 1 — Infraestructura (pipeline de datos)
1. Extraer metadata de 43k imágenes → `metadata.jsonl`.
2. Generar thumbnails 256px + medium 1024px.
3. Subir a Cloudflare R2 (3 buckets/prefixes: `original/`, `medium/`, `thumb/`).
4. Crear proyecto Supabase, schema, seed con metadata + coords calculadas.

### Fase 2 — Scaffold + Landing 3D
1. `create-next-app` con TypeScript + Tailwind.
2. Instalar R3F + drei + postprocessing + Supabase client.
3. Componer escena Louvre básica (geometría + materiales PBR).
4. GiocondaFrame con rotación temporal.
5. CameraControls con zoom a detalle.

### Fase 3 — SEO + páginas individuales
1. `/giocondas/[id]` con metadata rica.
2. Sitemap dinámico, robots, OG images.
3. JSON-LD por página.
4. Lighthouse audit → 95+.

### Fase 4 — Mapa Interstellar
1. `gravityLayout.ts` con pesos LoRA.
2. InstancedMesh 43k puntos.
3. Shader custom con thumbnail texture.
4. Hover / click → detail.

### Fase 5 — Deploy
1. GitHub repo.
2. Vercel deploy con env vars.
3. Namecheap DNS → Vercel.
4. Cloudflare CNAME `cdn` → R2.
5. Lighthouse + Search Console submit sitemap.

### Fase 6 (futuro) — Generación en vivo
1. Worker en Railway o máquina local con ComfyUI API + n8n.
2. Generador random prompt con mix de LoRAs.
3. Webhook → `POST /api/revalidate` → ISR rebuild.
4. UI: counter en tiempo real "N Giocondas, última generada hace X min".

## Responsive + Mobile-First (requerimiento crítico)

**La app debe funcionar igual desde cualquier dispositivo, especialmente celulares en vertical.**

Implicaciones técnicas:

1. **Performance 3D en mobile**: 
   - Texturas ≤ 1024px en mobile (2K en desktop).
   - Max 3 lights; preferir baked lighting en texturas.
   - Sombras desactivadas en mobile (o solo contact shadow).
   - `pixelRatio` clampeado a 1.5 max en mobile (ahorra fill rate).
   - `useDetectGPU` para downgrade automático en devices débiles.
   - Postprocessing reducido (solo tonemapping en mobile, no SSAO/bloom pesado).

2. **Controls adaptativos**:
   - Desktop: mouse orbit + scroll zoom + WASD walk.
   - Mobile: touch rotate (1 dedo) + pinch zoom (2 dedos) + tap para zoom a detalle.
   - Usar `drei/TouchControls` o custom Hammer.js handler.

3. **Layout responsive**:
   - Mobile portrait (1080×1920 aspect ratio típico): la sala se renderiza "retrato", con la Gioconda centrada y visibles paredes laterales mínimamente.
   - Mobile landscape: igual al desktop pero con UI overlay más compacta.
   - Desktop: escena inmersiva full-window.
   - UI chrome (nav, botones) oculta en mobile por defecto — reveal con tap.

4. **Canvas sizing**:
   - Canvas `100dvh × 100dvw` (dynamic viewport units, manejan Chrome mobile bar correctamente).
   - Resize listener + invalidate camera/renderer.
   - `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">`.

5. **Mapa Interstellar en mobile**:
   - 43k puntos killean mobile GPU. Soluciones:
     - InstancedMesh + frustum culling agresivo.
     - LOD: en mobile, solo mostrar N puntos más cercanos a la cámara (ej: 5k).
     - Clustering: agrupar puntos lejanos en meta-puntos que se expanden al acercarse.
   - Usar `WebGLRenderer` con `powerPreference: 'low-power'` en mobile si está muy lento.

6. **Imágenes**:
   - `next/image` sirve AVIF/WebP automáticamente.
   - Srcset: 256 / 512 / 1024 / 2048 → el navegador elige según DPR + viewport.
   - Lazy loading excepto la primera Gioconda visible (priority prop).

7. **Tipografía + touch targets**:
   - Tamaño mínimo 44×44px para botones (WCAG AA mobile).
   - `user-scalable=no` solo si vale la pena (debate de a11y).
   - Font responsive con `clamp()`.

8. **Testing**:
   - Chrome DevTools device emulation en al menos: iPhone 14, Samsung S23, iPad, y desktop 1080p + 4K.
   - Lighthouse mobile audit → 90+ performance, 100 accessibility.

## Pendientes de diseño con Nicolás

- **Estética concreta de la sala**: ¿exactamente igual a la foto del Louvre (paredes azul-grafito, banco curvo, claraboya) o con toque propio (más minimalista, color distinto)?
- **Duración del ciclo**: ¿exactamente 60s o acepta variable? Fade cross-dissolve o corte seco?
- **Zoom máximo**: ¿hasta ver pixelado (100% crop) o hasta ver un detalle estético (ej: la boca)?
- **Texto en la sala**: ¿hay placa al costado del cuadro con el nombre de la obra y año, o la sala queda "muda" como en el Louvre real?
- **Sonido**: ¿ambiental (pasos en madera, susurro de sala) o silencio total?
- **Audiencia target**: visitantes casuales vs curadores/críticos vs instituciones. Define el tono de `/about`.
- **Mobile gesture hints**: ¿mostrar overlay inicial "arrastrá para mirar alrededor, pellizcá para acercar" o que el usuario lo descubra?
