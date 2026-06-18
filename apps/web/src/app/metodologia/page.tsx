import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metodología y límites",
  description:
    "Cómo Infórmate Xatruch produce sus análisis, qué está verificado y qué es generado por inteligencia artificial, y cuáles son sus límites.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif font-black text-2xl mb-3">{title}</h2>
      <div className="font-article text-[16.5px] leading-relaxed text-ink-700 space-y-3">{children}</div>
    </section>
  );
}

export default function MetodologiaPage() {
  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-honduras-blue">
        Transparencia sobre nosotros mismos
      </div>
      <h1 className="font-serif font-black text-4xl sm:text-5xl mt-2 mb-3">Metodología y límites</h1>
      <p className="font-article text-lg text-ink-500 mb-10 max-w-[62ch]">
        Un medio que pide transparencia debe ser el primero en ser transparente. Esto es exactamente
        cómo se produce cada análisis, qué puedes confiar como verificado y qué debes leer con
        criterio.
      </p>

      <div className="bg-paper-200/50 border-l-4 border-honduras-red p-5 mb-10">
        <p className="font-bold text-ink mb-1">En una frase:</p>
        <p className="font-article text-ink-700">
          Tomamos el texto oficial de cada decreto y lo explicamos con ayuda de inteligencia
          artificial. El texto del decreto es real y verificable; el análisis es una interpretación
          automatizada, útil pero falible, y no sustituye asesoría legal.
        </p>
      </div>

      <Section title="De dónde sacamos las leyes">
        <p>
          Monitoreamos La Gaceta, el Diario Oficial de la República de Honduras, y extraemos el texto
          íntegro de cada decreto del Congreso Nacional directamente del PDF oficial publicado por el
          Estado. Ese PDF se enlaza en cada análisis como fuente primaria: cualquiera puede
          descargarlo y comprobar que no inventamos ni alteramos el contenido.
        </p>
      </Section>

      <Section title="Qué hace la inteligencia artificial (y qué no)">
        <p>
          Una vez tenemos el texto oficial, modelos de lenguaje de Anthropic (Claude) producen: un
          resumen en lenguaje sencillo, un análisis de causas, efectos, beneficios y riesgos, una
          estimación del impacto por clase social, y una revisión constitucional preliminar. La
          narración en video usa una voz sintética.
        </p>
        <p>
          La IA <strong>no</strong> decide qué es bueno o malo, no tiene línea editorial ni partido,
          y no añade hechos que no estén en el decreto o en el marco legal de referencia. Aun así,
          puede equivocarse, omitir matices o malinterpretar. Por eso cada página dice claramente
          que el contenido es generado por IA.
        </p>
      </Section>

      <Section title="Qué significa “fuentes verificadas”">
        <p>
          La fuente principal siempre es el texto oficial de La Gaceta. Las referencias adicionales
          que cita el análisis se comprueban automáticamente: solo mostramos y contamos los enlaces
          que realmente existen y responden. Si un enlace no resuelve, lo descartamos en lugar de
          presentarlo como respaldo. “Verificado” significa que la fuente existe y es accesible, {" "}
          <strong>no</strong> que un humano haya auditado que respalde cada afirmación.
        </p>
      </Section>

      <Section title="La revisión constitucional es preliminar, no un dictamen">
        <p>
          Cuando marcamos una <em>posible</em> tensión constitucional, es exactamente eso: una duda
          señalada por un análisis automatizado, comparando la ley con una selección de artículos de
          la Constitución. <strong>No es una sentencia.</strong> En Honduras, solo la Corte Suprema
          de Justicia puede declarar inconstitucional una ley (Arts. 184-185). Nuestra señal busca
          abrir el debate ciudadano y orientar a quien quiera revisarlo con un abogado, no sustituir
          a la justicia.
        </p>
      </Section>

      <Section title="Lo que todavía NO hacemos (y no fingimos hacer)">
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Voto nominal por diputado.</strong> El Congreso Nacional no publica oficialmente
            cómo votó cada diputado en cada decreto. Mientras no exista una fuente oficial y
            verificable, no mostramos historiales de votación individuales ni patrones de bancada, preferimos un vacío honesto a un dato inventado.
          </li>
          <li>
            <strong>Revisión humana caso por caso.</strong> Hoy el proceso es automatizado. No hay
            todavía un equipo editorial que apruebe cada análisis antes de publicarse.
          </li>
          <li>
            <strong>Transcripciones de sesiones y reconocimiento facial.</strong> Son capacidades
            planificadas; cuando no hay datos, la sección correspondiente aparece vacía, no rellena.
          </li>
        </ul>
      </Section>

      <Section title="Correcciones">
        <p>
          Si encuentras un error, un dato equivocado, una fuente caída, una interpretación
          injusta, queremos corregirlo. Reportarlo es parte de cómo este proyecto mejora. Las
          correcciones se aplican sobre el análisis afectado y se vuelven a generar a partir del
          texto oficial.
        </p>
      </Section>

      <Section title="Independencia">
        <p>
          Infórmate Xatruch no responde a ningún partido, candidato ni institución del Estado. Su
          único compromiso es con el texto de la ley y con el derecho del pueblo hondureño a
          entenderla. Sin sesgos. Solo la verdad que el documento oficial permite sostener.
        </p>
      </Section>
    </div>
  );
}
