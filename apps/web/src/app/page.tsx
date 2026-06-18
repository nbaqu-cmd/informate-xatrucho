import { api } from "../lib/api";
import { formatDate, estimateReadingMinutes } from "../lib/utils";
import { StatusBadge } from "../components/StatusBadge";
import { PhotoPlaceholder } from "../components/PhotoPlaceholder";
import { DataUnavailable } from "../components/DataUnavailable";
import { CONGRESO_PHOTO } from "../lib/media";

export default async function HomePage() {
  const [lawsResult, congressmenResult, partiesResult, alertsResult] = await Promise.allSettled([
    api.laws.list({ page: 1 }),
    api.congressmen.list(),
    api.parties.list(),
    api.alerts.list(),
  ]);

  const lawsFailed = lawsResult.status === "rejected";
  const laws = lawsResult.status === "fulfilled" ? lawsResult.value.laws : [];
  const totalLaws: number | null = lawsResult.status === "fulfilled" ? lawsResult.value.total : null;
  const totalCongressmen: number | null =
    congressmenResult.status === "fulfilled" ? congressmenResult.value.length : null;
  const totalParties: number | null = partiesResult.status === "fulfilled" ? partiesResult.value.length : null;
  const totalAlerts: number | null = alertsResult.status === "fulfilled" ? alertsResult.value.length : null;

  const [featured, ...rest] = laws;
  const secondary = rest.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {lawsFailed ? (
        <div className="pt-10 pb-7 border-b border-border">
          <DataUnavailable />
        </div>
      ) : !featured ? (
        <EmptyState />
      ) : (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-11 pt-10 pb-7 border-b border-border">
          <FeaturedStory law={featured} />
          <aside className="lg:col-span-1 flex flex-col border-l border-border pl-6">
            <h3 className="font-serif font-bold text-xl border-b-2 border-ink pb-2 mb-1">
              También en análisis
            </h3>
            {secondary.map((law) => (
              <SecondaryStory key={law.id} law={law} />
            ))}
          </aside>
        </section>
      )}

      {/* Dark stat strip */}
      <section className="bg-ink text-paper -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { value: totalLaws, label: "Leyes analizadas", border: "border-honduras-red" },
            { value: totalCongressmen, label: "Congresistas monitoreados", border: "border-honduras-blue" },
            { value: totalAlerts, label: "Alertas emitidas", border: "border-honduras-red" },
            { value: totalParties, label: "Partidos rastreados", border: "border-honduras-blue" },
          ].map(({ value, label, border }) => (
            <div key={label} className={`border-l-[3px] ${border} pl-4`}>
              <div className="font-serif font-black text-4xl sm:text-5xl leading-none">
                {value === null ? "—" : value.toLocaleString("es-HN")}
              </div>
              <div className="text-xs uppercase tracking-wide text-[#A8A498] font-semibold mt-1.5">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* More stories */}
      {rest.length > 4 && (
        <section className="py-12 border-b border-border">
          <div className="flex items-baseline justify-between mb-7 border-b-2 border-ink pb-2.5">
            <h2 className="font-serif font-black text-3xl">Más análisis recientes</h2>
            <a href="/leyes" className="text-honduras-red font-bold text-sm uppercase tracking-wide hover:underline">
              Ver archivo completo →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
            {rest.slice(4, 10).map((law) => (
              <a key={law.id} href={`/leyes/${law.id}`} className="group block">
                <div className="mb-4">
                  <PhotoPlaceholder
                    caption={`Decreto · ${law.lawNumber}`}
                    height={180}
                    src={law.imageUrl ?? undefined}
                  />
                </div>
                <div className="flex items-center gap-2 mb-2.5">
                  <StatusBadge status={law.status} size="sm" />
                  <span className="text-[11px] text-ink-500">{formatDate(law.gazetteDate)}</span>
                </div>
                <h3 className="font-serif font-bold text-xl leading-snug mb-2 group-hover:text-honduras-red transition-colors text-balance">
                  {law.title}
                </h3>
                {law.summary?.keyPoints && (
                  <p className="font-article text-ink-500 text-[15px] leading-relaxed line-clamp-2">
                    {(law.summary.keyPoints as string[])[0]}
                  </p>
                )}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 bg-paper-200 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-t border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-honduras-blue">
              El proceso
            </div>
            <h2 className="font-serif font-black text-3xl sm:text-4xl mt-2">
              Cómo se escribe el periodismo automatizado
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "01", title: "Detección", desc: "Monitoreamos el Diario La Gaceta y el Congreso Nacional cada hora buscando nuevas leyes." },
              { num: "02", title: "Análisis IA", desc: "Claude AI analiza causas, efectos, impacto por clase social y constitucionalidad." },
              { num: "03", title: "Verificación", desc: "Cada afirmación se contrasta con el texto oficial del decreto y la Constitución vigente." },
              { num: "04", title: "Publicación", desc: "Generamos videos, publicamos en redes y compilamos un reporte completo y trazable." },
            ].map(({ num, title, desc }) => (
              <div key={title} className="relative pt-8">
                <span className="absolute -top-5 -left-1 font-serif font-black text-7xl text-ink/[0.06] select-none">
                  {num}
                </span>
                <div className="relative">
                  <h3 className="font-serif font-bold text-xl mb-2 text-honduras-red">{title}</h3>
                  <p className="font-article text-[15px] text-ink-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedStory({
  law,
}: {
  law: Awaited<ReturnType<typeof api.laws.list>>["laws"][number];
}) {
  const readingMinutes = estimateReadingMinutes(
    law.summary?.plainSpanish,
    law.analysis?.causes,
    law.analysis?.effects,
    law.analysis?.benefits,
    law.analysis?.drawbacks
  );
  const sourceCount = law.analysis?.sources.length ?? 0;

  return (
    <a href={`/leyes/${law.id}`} className="lg:col-span-2 group block">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="inline-block bg-honduras-red text-white text-[11px] font-bold uppercase tracking-widest px-2.5 py-1">
          Última hora
        </span>
        <StatusBadge status={law.status} />
      </div>
      <h1 className="font-serif font-black text-4xl sm:text-5xl leading-[1.03] mb-5 text-balance group-hover:text-honduras-red transition-colors">
        {law.title}
      </h1>
      <div className="mb-1.5">
        <PhotoPlaceholder
          caption={`Portada · Decreto ${law.lawNumber}`}
          aspectVideo
          src={law.imageUrl ?? CONGRESO_PHOTO.src}
        />
      </div>
      <p className="text-[11px] text-ink-500 mb-6">{law.imageCredit ?? CONGRESO_PHOTO.credit}</p>
      {law.summary?.keyPoints && (
        <p className="font-article text-lg text-ink-700 leading-relaxed drop-cap mb-5 max-w-[62ch]">
          {(law.summary.keyPoints as string[]).slice(0, 2).join(" ")}
        </p>
      )}
      <div className="flex items-center gap-3 text-[13px] text-ink-500 border-t border-border pt-3.5 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-[22px] h-[22px] rounded-full bg-ink text-white flex items-center justify-center text-[10px] font-bold">
            IA
          </span>
          Redacción automatizada
        </span>
        <span className="text-border">·</span>
        <span>Decreto {law.lawNumber}</span>
        <span className="text-border">·</span>
        <span>{readingMinutes} min de lectura</span>
        {sourceCount > 0 && (
          <>
            <span className="text-border">·</span>
            <span className="text-honduras-blue font-bold">
              Verificado con {sourceCount} fuente{sourceCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </div>
    </a>
  );
}

function SecondaryStory({
  law,
}: {
  law: Awaited<ReturnType<typeof api.laws.list>>["laws"][number];
}) {
  return (
    <a href={`/leyes/${law.id}`} className="group block py-5 border-b border-border last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <StatusBadge status={law.status} size="sm" />
        <span className="text-[11px] text-ink-500">{formatDate(law.gazetteDate)}</span>
      </div>
      <h4 className="font-serif font-bold text-base leading-snug group-hover:text-honduras-red transition-colors text-balance">
        {law.title}
      </h4>
      <div className="text-xs text-ink-500 font-medium mt-2">Decreto {law.lawNumber}</div>
    </a>
  );
}

function EmptyState() {
  return (
    <div className="py-24 text-center border-b border-border">
      <div className="text-5xl mb-4" aria-hidden="true">📰</div>
      <h2 className="font-serif font-black text-3xl mb-3">Aún no hay leyes procesadas</h2>
      <p className="font-article text-ink-500 max-w-md mx-auto text-lg">
        El pipeline está activo y monitoreando el Diario La Gaceta y el Congreso Nacional. La
        primera ley aparecerá aquí en cuanto se detecte y se complete el análisis.
      </p>
    </div>
  );
}
