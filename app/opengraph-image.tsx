import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Infinite are better than one — 43.469 Giocondas generadas con IA entrenada en artistas argentinos";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

/**
 * OG image dinámica generada con @vercel/og — se sirve en /opengraph-image.
 * Next 15 la usa automáticamente para OpenGraph + Twitter si existe en app/.
 *
 * Diseño: fondo oscuro con radial gradient cálido que imita el spot del
 * museo, título grande en serif, subtítulo bilingüe, footer con award.
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 70px",
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,228,180,0.12) 0%, rgba(10,13,19,1) 70%)",
          backgroundColor: "#0a0d13",
          color: "white",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              color: "#a3a3a3",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
            }}
          >
            by Nicolás Ruarte · NoMa Studio AI
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 500,
              lineHeight: 1.05,
              marginTop: 18,
              color: "#fafafa",
              maxWidth: 950,
            }}
          >
            infinite are better than one
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              fontSize: 38,
              color: "#e5e5e5",
              lineHeight: 1.3,
              maxWidth: 1000,
            }}
          >
            43.469 Giocondas generadas con IA
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#a3a3a3",
              fontStyle: "italic",
              fontFamily: "sans-serif",
            }}
          >
            AI-generated Mona Lisas trained on Argentine artists
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#737373",
            borderTop: "1px solid #262626",
            paddingTop: 24,
            fontFamily: "sans-serif",
          }}
        >
          <div>infinitearebetterthanone.com</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ color: "#d4a574" }}>★</span>
            <span>Premio Pueyrredón 2025</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
