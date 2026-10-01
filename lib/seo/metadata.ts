import type { Metadata } from "next";
import type { Gioconda } from "@/lib/supabase/types";
import { giocondaUrl } from "@/lib/r2/urls";

export const SITE_NAME = "Infinite are better than one";
export const SITE_URL = "https://infinitearebetterthanone.com";
export const AUTHOR = "Nicolás Ruarte";
export const TWITTER_HANDLE = "@nomastudioai";
export const ORGANIZATION = "NoMa Studio AI";

/**
 * Descripción bilingüe — Google indexa ambos idiomas. Frontloaded con
 * keywords de alta intención: "gioconda", "IA", "arte argentino", "Mona Lisa".
 * Máximo ~160 caracteres para no truncar en SERPs.
 */
const DEFAULT_DESCRIPTION_ES =
  "43.469 Giocondas generadas con IA entrenada en artistas argentinos. Arte argentino con inteligencia artificial. Finalista Premio Pueyrredón 2025. Por Nicolás Ruarte.";

const DEFAULT_DESCRIPTION_EN =
  "43,469 Mona Lisas reimagined by AI trained on Argentine artists. Argentine AI art. Finalist, Premio Pueyrredón 2025. By Nicolás Ruarte / NoMa Studio AI.";

/**
 * Keywords ampliadas con variantes en español, inglés y combinaciones de
 * intención de búsqueda. Ordenadas por relevancia (Google ya no usa la
 * meta keywords pero Bing/Yandex sí, y sirve de documentación).
 */
const KEYWORDS = [
  // Core art keywords (ES)
  "gioconda",
  "la gioconda",
  "mona lisa",
  "gioconda IA",
  "gioconda ai",
  "mona lisa IA",
  // Argentine AI art
  "arte argentino",
  "arte argentino IA",
  "arte argentino ai",
  "IA argentina",
  "inteligencia artificial argentina",
  "artistas argentinos IA",
  // Generic AI art
  "arte generativo",
  "AI art",
  "generative art",
  "Stable Diffusion",
  "LoRA",
  // Argentine masters used in training
  "Benito Quinquela Martín IA",
  "Xul Solar IA",
  "Antonio Berni IA",
  "Leonor Fini IA",
  "Raquel Forner IA",
  "Julio Le Parc IA",
  "Marta Minujín IA",
  "El Eternauta IA",
  "diseño indígena argentino",
  // Creator
  "Nicolás Ruarte",
  "Nicolas Ruarte",
  "NoMa Studio AI",
  "NoMa Studio",
  "Premio Pueyrredón 2025",
  "Premio Pueyrredón de Artes Visuales",
];

/**
 * Metadata default con localización bilingüe. `alternateLocale` le dice a
 * Google que la misma página existe en otro idioma. Los hreflang concretos
 * se construyen en layout.tsx via `alternates.languages`.
 */
export const DEFAULT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 43.469 Giocondas generadas con IA`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION_ES,
  keywords: KEYWORDS,
  authors: [{ name: AUTHOR, url: SITE_URL }],
  creator: AUTHOR,
  publisher: ORGANIZATION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    // Locale primario español (Argentina) — coincide con audiencia target.
    // Google usa esto como señal del idioma principal del contenido.
    locale: "es_AR",
    alternateLocale: ["es_ES", "en_US"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 43.469 Giocondas generadas con IA`,
    description: DEFAULT_DESCRIPTION_ES,
    // NOTE: El og:image se genera automáticamente desde app/opengraph-image.tsx
    // (archivo edge function con @vercel/og). No lo listamos acá para evitar
    // colisión con el auto-generated.
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    title: `${SITE_NAME} — 43.469 Giocondas generadas con IA`,
    description: DEFAULT_DESCRIPTION_EN,
    // También auto-populado por Next desde opengraph-image.tsx (Twitter reusa
    // el OG image si summary_large_image).
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      // hreflang explícito: misma URL sirve ambos idiomas con contenido
      // bilingüe visible. Google decidirá cuál mostrar según geo/idioma
      // del usuario.
      "es-AR": SITE_URL,
      "es": SITE_URL,
      "en": SITE_URL,
      "x-default": SITE_URL,
    },
  },
  category: "art",
  other: {
    // Señal extra para Pinterest/LinkedIn
    "article:author": AUTHOR,
    "article:publisher": ORGANIZATION,
  },
};

export function giocondaMetadata(g: Gioconda): Metadata {
  const styleLabel = g.primary_style
    ? g.primary_style.replace(/_AI.*$/, "").replace(/_/g, " ")
    : "mixed styles";
  const title = `Gioconda #${g.id} — ${styleLabel}`;
  // Descripción bilingüe intercalada para capturar búsquedas en ambos idiomas.
  const description = g.is_mixed
    ? `Mona Lisa reimaginada por IA: mezcla de estilos argentinos. Una de 43.469 Giocondas únicas generadas con inteligencia artificial. Finalista Premio Pueyrredón 2025. By Nicolás Ruarte.`
    : `Mona Lisa reimaginada por IA en el estilo de ${styleLabel}. Arte argentino generativo. Una de 43.469 Giocondas únicas. Finalista Premio Pueyrredón 2025. By Nicolás Ruarte.`;
  const canonical = `${SITE_URL}/giocondas/${g.id}`;
  const imageUrl = giocondaUrl(g.filename, "medium");

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "es-AR": canonical,
        "es": canonical,
        "en": canonical,
        "x-default": canonical,
      },
    },
    openGraph: {
      type: "article",
      url: canonical,
      locale: "es_AR",
      alternateLocale: ["en_US"],
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: Math.round((g.height / g.width) * 1024),
          alt: `Gioconda #${g.id} generada con IA — estilo ${styleLabel} · Arte argentino con inteligencia artificial`,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
  };
}
