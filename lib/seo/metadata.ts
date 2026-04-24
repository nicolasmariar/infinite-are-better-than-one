import type { Metadata } from "next";
import type { Gioconda } from "@/lib/supabase/types";
import { giocondaUrl } from "@/lib/r2/urls";

export const SITE_NAME = "Infinite are better than one";
export const SITE_URL = "https://infinitearebetterthanone.com";
export const AUTHOR = "Nicolás Ruarte";
export const TWITTER_HANDLE = "@nomastudioai";

const DEFAULT_DESCRIPTION =
  "A never-ending gallery of Mona Lisas reimagined by AI models trained on Argentine artists. A virtual Louvre with one painting that changes every minute. Premio Pueyrredón de Artes Visuales 2025 — work by Nicolás Ruarte / NoMa Studio AI.";

export const DEFAULT_METADATA: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 43.469+ Mona Lisas by AI`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "gioconda",
    "mona lisa",
    "AI art",
    "generative art",
    "Stable Diffusion",
    "LoRA",
    "Argentine artists",
    "Quinquela Martín",
    "Xul Solar",
    "Berni",
    "Leonor Fini",
    "Raquel Forner",
    "Julio Le Parc",
    "Marta Minujín",
    "Nicolás Ruarte",
    "NoMa Studio AI",
    "Premio Pueyrredón 2025",
    "arte generativo",
    "inteligencia artificial",
  ],
  authors: [{ name: AUTHOR, url: SITE_URL }],
  creator: AUTHOR,
  publisher: "NoMa Studio AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["es_AR"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
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
  },
  category: "art",
};

export function giocondaMetadata(g: Gioconda): Metadata {
  const styleLabel = g.primary_style
    ? g.primary_style.replace(/_AI.*$/, "").replace(/_/g, " ")
    : "mixed styles";
  const title = `Gioconda #${g.id} — ${styleLabel}`;
  const description = g.is_mixed
    ? `Mona Lisa reimagined by AI — a mix of Argentine artistic styles. One of ${43469}+ unique Giocondas in an ever-growing dataset. Premio Pueyrredón 2025.`
    : `Mona Lisa reimagined in the style of ${styleLabel}. One of ${43469}+ unique Giocondas in an ever-growing dataset. Premio Pueyrredón 2025.`;
  const canonical = `${SITE_URL}/giocondas/${g.id}`;
  const imageUrl = giocondaUrl(g.filename, "medium");

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1024,
          height: Math.round((g.height / g.width) * 1024),
          alt: `Gioconda #${g.id} reimagined by AI — ${styleLabel}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
