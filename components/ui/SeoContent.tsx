import Link from "next/link";

/**
 * Sección de contenido SEO-rich visible bajo el canvas.
 * Contiene el H1 real de la página (para Google), texto bilingüe
 * con keywords target, y enlaces internos estratégicos.
 *
 * UX rationale: el 3D museum ocupa 100vh al cargar. Este contenido se
 * descubre al hacer scroll, no interrumpe la experiencia primaria pero
 * provee todo el texto que los crawlers necesitan para rankear la página.
 */
export function SeoContent() {
  const styles = [
    { slug: "quinquela", name: "Benito Quinquela Martín", note: "pintor del puerto de La Boca" },
    { slug: "xul-solar", name: "Xul Solar", note: "pintor y místico argentino" },
    { slug: "berni", name: "Antonio Berni", note: "creador de Juanito Laguna" },
    { slug: "forner", name: "Raquel Forner", note: "pionera del arte espacial argentino" },
    { slug: "fini", name: "Leonor Fini", note: "surrealista ítalo-argentina" },
    { slug: "de-la-carcova", name: "Ernesto de la Cárcova", note: "realismo social argentino" },
    { slug: "le-parc", name: "Julio Le Parc", note: "arte cinético y óptico" },
    { slug: "minujin", name: "Marta Minujín", note: "happening y arte pop argentino" },
    { slug: "casares", name: "Casares", note: "tradición costumbrista argentina" },
    { slug: "el-eternauta", name: "El Eternauta", note: "cómic argentino de ciencia ficción" },
    { slug: "diseno-indigena", name: "Diseño Indígena Argentino", note: "iconografía de pueblos originarios" },
    { slug: "noma", name: "NoMa", note: "estilo propio del estudio" },
  ];

  return (
    <article className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-neutral-200 sm:px-10">
      <header className="mb-12">
        {/* H1 real de la página con la keyword primaria frontloaded.
            El "infinite are better than one" del overlay es h1 visual;
            este es el h1 semántico que Google usa para rankear. */}
        <h1 className="font-serif text-4xl leading-tight text-neutral-50 sm:text-5xl">
          La Gioconda reimaginada por IA argentina
        </h1>
        <p className="mt-2 font-serif text-xl italic text-neutral-400">
          Mona Lisa reimagined by Argentine AI
        </p>
      </header>

      <section className="space-y-6 text-base leading-relaxed text-neutral-300">
        <p>
          <strong className="text-neutral-100">Infinite are better than one</strong> es una
          obra de arte generativo de <strong>Nicolás Ruarte</strong> que reúne{" "}
          <strong>43.469 Giocondas</strong> únicas generadas con inteligencia artificial.
          Cada imagen es una reinterpretación de <em>La Gioconda</em> de Leonardo da Vinci,
          producida por doce modelos de IA (LoRAs sobre Stable Diffusion) entrenados
          individualmente sobre la obra de grandes <strong>artistas argentinos</strong>.
        </p>
        <p className="text-neutral-400">
          A never-ending gallery of Mona Lisas reimagined by AI models trained on
          Argentine masters. 43,469 unique Giocondas produced by twelve Stable Diffusion
          LoRAs, each capturing the style of a different Argentine artist.
        </p>
        <p>
          La obra fue finalista del <strong>Premio Prilidiano Pueyrredón de Artes Visuales 2025</strong> y
          forma parte del proyecto de tesis de Ruarte en la UNA (Universidad Nacional
          de las Artes) sobre <em>la obra de arte en la época de su generatividad técnica</em> —
          un ensayo artístico y filosófico sobre el rol del artista en la era de la IA
          generativa.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-neutral-100">
          Doce modelos de IA entrenados en maestros argentinos
        </h2>
        <p className="mt-3 text-sm text-neutral-400">
          Twelve AI models trained on Argentine masters
        </p>
        <ul className="mt-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {styles.map((s) => (
            <li
              key={s.slug}
              className="rounded-md border border-neutral-800/60 bg-neutral-900/40 px-4 py-3"
            >
              <strong className="text-neutral-100">{s.name}</strong>
              <span className="block text-xs text-neutral-500">{s.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-neutral-400">
          Cada modelo es un LoRA (Low-Rank Adaptation) entrenado sobre Stable Diffusion
          con un dataset curado de la obra del artista. Los prompts combinan uno o
          varios de estos estilos con pesos variables, generando híbridos que nunca
          antes existieron.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-neutral-100">
          ¿Qué es una Gioconda IA?
        </h2>
        <p className="mt-3 text-sm text-neutral-400">What is an AI Gioconda?</p>
        <p className="mt-4">
          Una <strong>Gioconda IA</strong> es una imagen generada por inteligencia
          artificial que reinterpreta <em>La Mona Lisa</em> de Leonardo da Vinci a
          través del lenguaje visual de un artista entrenado como modelo. En esta
          colección, cada Gioconda es una Mona Lisa única producida por un modelo
          de Stable Diffusion con un LoRA argentino aplicado — un cruce entre
          historia del arte universal y tradición pictórica argentina.
        </p>
        <p className="mt-4">
          El dataset completo de <strong>43.469 imágenes</strong> está disponible
          para explorar individualmente en{" "}
          <Link
            href="/giocondas"
            className="underline decoration-neutral-500 underline-offset-4 hover:text-neutral-100"
          >
            /giocondas
          </Link>
          . Cada una tiene su propia página con los prompts, seeds, LoRAs y
          parámetros de generación.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-neutral-100">
          Arte argentino con inteligencia artificial
        </h2>
        <p className="mt-3 text-sm text-neutral-400">Argentine art with AI</p>
        <p className="mt-4">
          La obra se inscribe en una línea de trabajo que explora cómo la{" "}
          <strong>IA argentina</strong> puede preservar, extender y reinterpretar la
          tradición visual del país. No se trata de reemplazar al artista sino de
          usar la IA como herramienta de diálogo con el pasado: entrenar un modelo
          sobre Quinquela es, en cierto sentido, una forma de hacer que Quinquela
          pinte una Mona Lisa que nunca pintó.
        </p>
        <p className="mt-4">
          Otros proyectos relacionados de Nicolás Ruarte incluyen{" "}
          <strong>imaginAR</strong> (instalación interactiva con los mismos 12
          modelos) y <strong>La Fileteadora</strong> (modelo Flux entrenado en
          fileteado porteño).
        </p>
      </section>

      <section className="mt-12 rounded-xl border border-neutral-800/60 bg-neutral-900/30 p-6 text-sm">
        <h2 className="font-serif text-lg text-neutral-100">
          Próximamente: mapa 3D interestelar
        </h2>
        <p className="mt-3 text-neutral-400">
          Un cloud map en 3D estilo <em>Interstellar</em> donde cada Gioconda se
          posiciona según los pesos LoRA de los estilos que la componen. Las puras
          quedarán cerca de su anchor; las híbridas flotarán entre ellos —
          representación visual de la hibridación de identidades culturales.
        </p>
      </section>

      <footer className="mt-16 border-t border-neutral-800/60 pt-8 text-xs text-neutral-500">
        <p>
          © {new Date().getFullYear()} Nicolás Ruarte / NoMa Studio AI.
          Infinite are better than one · Finalista del Premio Prilidiano Pueyrredón de Artes Visuales 2025.
        </p>
        <p className="mt-2">
          Related: <Link href="/giocondas" className="underline hover:text-neutral-300">All 43,469 Giocondas</Link>
          {" · "}
          <a href="https://nomastudio.ai" className="underline hover:text-neutral-300">
            NoMa Studio AI
          </a>
        </p>
      </footer>
    </article>
  );
}
