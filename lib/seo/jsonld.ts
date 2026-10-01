import type { Gioconda } from "@/lib/supabase/types";
import { giocondaUrl } from "@/lib/r2/urls";
import { AUTHOR, ORGANIZATION, SITE_NAME, SITE_URL } from "./metadata";

/**
 * Structured data JSON-LD para cada Gioconda.
 * Google lo usa para rich snippets en SERPs ("Images", "Creative works").
 */
export function giocondaJsonLd(g: Gioconda) {
  const styleLabel = g.primary_style
    ? g.primary_style.replace(/_AI.*$/, "").replace(/_/g, " ")
    : "mixed";

  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    "@id": `${SITE_URL}/giocondas/${g.id}`,
    name: `Gioconda #${g.id}`,
    alternateName: [`Mona Lisa #${g.id}`, `La Gioconda #${g.id}`],
    url: `${SITE_URL}/giocondas/${g.id}`,
    image: giocondaUrl(g.filename, "medium"),
    thumbnailUrl: giocondaUrl(g.filename, "thumb"),
    creator: {
      "@type": "Person",
      "@id": `${SITE_URL}#creator`,
      name: AUTHOR,
      url: SITE_URL,
      nationality: "Argentine",
    },
    artMedium: "Stable Diffusion + LoRA (AI generative)",
    artform: "Digital painting (AI-generated)",
    artworkSurface: "digital",
    dateCreated: g.created_at,
    inLanguage: ["es", "en"],
    isBasedOn: {
      "@type": "VisualArtwork",
      name: "Mona Lisa (La Gioconda)",
      creator: { "@type": "Person", name: "Leonardo da Vinci" },
      dateCreated: "1503-1519",
    },
    keywords: [
      "gioconda",
      "mona lisa",
      "gioconda IA",
      "mona lisa ai",
      "arte argentino",
      "arte argentino IA",
      "AI art",
      "generative art",
      "arte generativo",
      styleLabel,
      g.is_mixed ? "mixed styles" : "pure style",
    ].join(", "),
    width: { "@type": "QuantitativeValue", value: g.width, unitCode: "E37" },
    height: { "@type": "QuantitativeValue", value: g.height, unitCode: "E37" },
    isPartOf: {
      "@type": "Collection",
      "@id": SITE_URL,
      name: SITE_NAME,
      url: SITE_URL,
      numberOfItems: 43469,
    },
  };
}

/**
 * Collection JSON-LD para la homepage — declara el dataset entero.
 */
export function collectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    "@id": SITE_URL,
    name: SITE_NAME,
    alternateName: [
      "Infinito es mejor que uno",
      "43.469 Giocondas",
      "Gioconda IA",
    ],
    url: SITE_URL,
    description:
      "Una galería infinita de Giocondas reimaginadas por 12 modelos de IA entrenados en artistas argentinos. La Mona Lisa en 43.469 variaciones generadas con Stable Diffusion + LoRA.",
    inLanguage: ["es", "en"],
    creator: {
      "@type": "Person",
      "@id": `${SITE_URL}#creator`,
      name: AUTHOR,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: ORGANIZATION,
    },
    numberOfItems: 43469,
    award: "Premio Pueyrredón de Artes Visuales 2025",
    genre: ["AI art", "arte generativo", "arte argentino"],
    keywords:
      "gioconda, mona lisa, gioconda IA, arte argentino, IA argentina, Stable Diffusion, LoRA, Quinquela, Xul Solar, Berni, Leonor Fini, Raquel Forner, Le Parc, Minujín, El Eternauta",
  };
}

/**
 * Person JSON-LD para Nicolás Ruarte — establece autoridad del autor,
 * clave para que Google entienda "Nicolás Ruarte" como entidad.
 */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}#creator`,
    name: AUTHOR,
    alternateName: ["Nicolas Ruarte", "Nico Ruarte"],
    nationality: "Argentine",
    jobTitle: ["Artist", "AI researcher", "Founder of NoMa Studio AI"],
    url: SITE_URL,
    worksFor: {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: ORGANIZATION,
    },
    award: "Premio Pueyrredón de Artes Visuales 2025",
    description:
      "Artista e investigador argentino especializado en arte generativo con inteligencia artificial. Tesis UNA sobre IA generativa. Creador de Infinite are better than one, imaginAR y La Fileteadora.",
    knowsAbout: [
      "Stable Diffusion",
      "LoRA training",
      "Generative AI",
      "Argentine art",
      "Arte argentino",
      "Inteligencia artificial generativa",
    ],
  };
}

/**
 * Organization JSON-LD para NoMa Studio AI.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}#organization`,
    name: ORGANIZATION,
    alternateName: "NoMa Studio",
    url: "https://nomastudio.ai",
    founder: {
      "@type": "Person",
      "@id": `${SITE_URL}#creator`,
      name: AUTHOR,
    },
    sameAs: ["https://twitter.com/nomastudioai"],
    description:
      "Estudio de arte e IA fundado por Nicolás Ruarte. Explorando la intersección entre inteligencia artificial generativa y arte argentino.",
    areaServed: "Worldwide",
  };
}

/**
 * Breadcrumbs para páginas de Gioconda individuales.
 */
export function breadcrumbJsonLd(giocondaId: number) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "All Giocondas",
        item: `${SITE_URL}/giocondas`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Gioconda #${giocondaId}`,
        item: `${SITE_URL}/giocondas/${giocondaId}`,
      },
    ],
  };
}
