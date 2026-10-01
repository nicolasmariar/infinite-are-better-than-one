import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DEFAULT_METADATA } from "@/lib/seo/metadata";
import {
  collectionJsonLd,
  organizationJsonLd,
  personJsonLd,
} from "@/lib/seo/jsonld";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = DEFAULT_METADATA;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  themeColor: "#1a1f2a",
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      // Idioma primario ES-AR: coincide con audiencia target (Argentina) y
      // con las keywords de intención ("gioconda IA", "arte argentino IA").
      // El contenido bilingüe ES/EN visible en el DOM le da a Google señales
      // para mostrar la página en ambos idiomas.
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Preload de la textura del marco — se descarga en paralelo con el JS.
            Crítico para LCP: sin esto, el fetch del webp arranca recién cuando
            React hidrata + R3F monta (2-3s después en mobile). */}
        <link
          rel="preload"
          as="image"
          href="/frame/gioconda-frame-louvre.webp"
          type="image/webp"
          fetchPriority="high"
        />
        {/* DNS prefetch del CDN de R2 para acelerar las Giocondas */}
        <link
          rel="dns-prefetch"
          href="https://pub-2c5f94f606da414798fc9db7cc4413ec.r2.dev"
        />
        <link
          rel="preconnect"
          href="https://pub-2c5f94f606da414798fc9db7cc4413ec.r2.dev"
          crossOrigin="anonymous"
        />
        {/* JSON-LD encadenado: Collection + Person + Organization con @id
            cruzados para que Google entienda que son entidades relacionadas. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#1a1f2a] text-neutral-100">
        {children}
      </body>
    </html>
  );
}
