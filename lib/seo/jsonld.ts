import type { Gioconda } from "@/lib/supabase/types";
import { giocondaUrl } from "@/lib/r2/urls";
import { AUTHOR, SITE_NAME, SITE_URL } from "./metadata";

/**
 * Genera structured data JSON-LD tipo `VisualArtwork` para cada Gioconda.
 * Google lo usa para ricos snippets de arte en los resultados de búsqueda.
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
    url: `${SITE_URL}/giocondas/${g.id}`,
    image: giocondaUrl(g.filename, "medium"),
    creator: {
      "@type": "Person",
      name: AUTHOR,
      url: SITE_URL,
    },
    artMedium: "Stable Diffusion + LoRA (AI generative)",
    artform: "Digital painting (AI-generated)",
    artworkSurface: "digital",
    dateCreated: g.created_at,
    inLanguage: ["en", "es"],
    isBasedOn: {
      "@type": "VisualArtwork",
      name: "Mona Lisa (La Gioconda)",
      creator: { "@type": "Person", name: "Leonardo da Vinci" },
      dateCreated: "1503-1519",
    },
    keywords: [
      "gioconda",
      "mona lisa",
      "AI art",
      "generative art",
      styleLabel,
      g.is_mixed ? "mixed styles" : "pure style",
    ].join(", "),
    width: { "@type": "QuantitativeValue", value: g.width, unitCode: "E37" },
    height: { "@type": "QuantitativeValue", value: g.height, unitCode: "E37" },
    isPartOf: {
      "@type": "Collection",
      name: SITE_NAME,
      url: SITE_URL,
      numberOfItems: 43469,
    },
  };
}

export function collectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Collection",
    "@id": SITE_URL,
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "A never-ending gallery of Mona Lisas reimagined by AI models trained on Argentine artists.",
    creator: {
      "@type": "Person",
      name: AUTHOR,
      url: SITE_URL,
    },
    numberOfItems: 43469,
    award: "Premio Pueyrredón de Artes Visuales 2025",
  };
}
