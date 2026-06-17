import type { Metadata } from "next";
import { api, ApiError } from "../../../lib/api";
import { DataUnavailable } from "../../../components/DataUnavailable";
import { formatDate, estimateReadingMinutes } from "../../../lib/utils";
import { notFound } from "next/navigation";
import { StatusBadge } from "../../../components/StatusBadge";
import { PhotoPlaceholder } from "../../../components/PhotoPlaceholder";
import { VotingTable, type VoteRow } from "../../../components/VotingTable";
import { SITE_URL } from "../../../lib/seo";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const law = await api.laws.get(params.id);
    const description = law.summary?.plainSpanish
      ? law.summary.plainSpanish.slice(0, 155)
      : `Análisis automatizado del Decreto ${law.lawNumber} por Infórmate Xatrucho.`;
    return {
      title: law.title,
      description,
      openGraph: { title: law.title, description, type: "article", publishedTime: law.gazetteDate },
      twitter: { card: "summary_large_image", title: law.title, description },
    };
  } catch {
    return { title: "Ley no encontrada" };
  }
}

const VERDICT_COLORS: Record<string, string> = {
  COMPATIBLE: "text-accent-green",
  QUESTIONABLE: "text-accent-amber",
  CONTRADICTORY: "text-honduras-red",
};

const PLATFORM_ICONS: Record<string, string> = {
  TIKTOK: "🎵",
  INSTAGRAM: "📸",
  YOUTUBE: "▶️",
};

const ANALYSIS_SECTIONS = [
  { key: "causes" as const, title: "Causas", color: "border-honduras-blue", text: "text-honduras-blue" },
  { key: "effects" as const, title: "Efectos", color: "border-accent-amber", text: "text-accent-amber" },
  { key: "benefits" as const, title: "Beneficios", color: "border-accent-green", text: "text-accent-green" },
  { key: "drawbacks" as const, title: "Riesgos", color: "border-honduras-red", text: "text-honduras-red" },
];

export default async function LawDetailPage({ params }: { params: { id: string } }) {
  let law;
  try {
    law = await api.laws.get(params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <a href="/leyes" className="text-xs uppercase tracking-widest font-bold text-ink-500 hover:text-honduras-red transition-colors">
          ← Archivo
        </a>
        <div className="mt-8">
          <DataUnavailable message="No se pudo cargar esta ley. El servidor puede estar temporalmente fuera de línea — intenta de nuevo en unos momentos." />
        </div>
      </div>
    );
  }

  const voteCounts = { FOR: 0, AGAINST: 0, ABSTAIN: 0, ABSENT: 0 };
  law.votes?.forEach((v) => {
    voteCounts[v.vote as keyof typeof voteCounts]++;
  });

  const voteRows: VoteRow[] = (law.votes ?? []).map((v) => ({
    name: v.congressman.name,
    party: v.party.name,
    partyColor: v.party.color,
    vote: v.vote,
  }));

  const readingMinutes = estimateReadingMinutes(
    law.summary?.plainSpanish,
    law.analysis?.causes,
    law.analysis?.effects,
    law.analysis?.benefits,
    law.analysis?.drawbacks,
    law.impactAnalysis?.poorImpact,
    law.impactAnalysis?.middleImpact,
    law.impactAnalysis?.wealthyImpact,
    law.constitutionalReview?.findings
  );
  const sourceCount = law.analysis?.sources.length ?? 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: law.title,
    datePublished: law.gazetteDate,
    description: law.summary?.plainSpanish,
    url: `${SITE_URL}/leyes/${law.id}`,
    publisher: { "@type": "Organization", name: "Infórmate Xatrucho" },
    author: { "@type": "Organization", name: "Infórmate Xatrucho" },
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 lg:px-8 pt-11 pb-2">
        {/* Breadcrumb */}
        <a href="/leyes" className="text-xs uppercase tracking-widest font-bold text-ink-500 hover:text-honduras-red transition-colors">
          ← Archivo
        </a>

        {/* Headline */}
        <div className="flex items-center gap-3 mt-5 mb-4 flex-wrap">
          <span className="inline-block bg-honduras-red text-white text-[11px] font-bold uppercase tracking-widest px-2.5 py-1">
            Análisis legislativo
          </span>
          <StatusBadge status={law.status} />
        </div>
        <h1 className="font-serif font-black text-4xl sm:text-5xl leading-[1.04] tracking-tight mb-6 text-balance">
          {law.title}
        </h1>

        {/* Byline */}
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-500 border-t border-b border-border py-3.5 mb-7">
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-[10px] font-bold">
              IA
            </span>
            Redacción automatizada Xatrucho
          </span>
          <span className="text-border">·</span>
          <span>Decreto {law.lawNumber}</span>
          <span className="text-border">·</span>
          <span>{formatDate(law.gazetteDate)}</span>
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
          {law.report?.pdfUrl && (
            <a
              href={law.report.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-honduras-red font-bold text-xs uppercase tracking-wide hover:underline"
            >
              📄 PDF completo
            </a>
          )}
        </div>

        <div className="mb-2">
          <PhotoPlaceholder caption={`Fotografía · Decreto ${law.lawNumber}`} height={360} />
        </div>
        <p className="text-xs text-ink-500 mb-9">
          Imagen ilustrativa. El análisis completo del texto se encuentra a continuación.
        </p>

        {/* Videos / social */}
        {(law.videos?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {law.videos?.map((video) => (
              <a
                key={video.url}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border hover:border-honduras-red transition-colors px-4 py-2.5 text-sm font-bold flex items-center gap-2"
              >
                {video.type === "TIKTOK_REELS" ? "🎵 TikTok / Reels (9:16)" : "▶️ YouTube (16:9)"}
                <span className="text-ink-500 font-normal">{Math.round(video.duration / 60)}min</span>
              </a>
            ))}
          </div>
        )}
        {(law.socialPosts?.length ?? 0) > 0 && (
          <div className="flex gap-2 mb-9 flex-wrap items-center">
            <span className="text-xs uppercase tracking-wide font-bold text-ink-500">Publicado en:</span>
            {law.socialPosts?.filter((p) => p.status === "PUBLISHED").map((post) => (
              <a
                key={post.platform}
                href={post.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-paper-200 text-ink-700 px-3 py-1 text-sm flex items-center gap-1.5 hover:bg-ink/10 transition-colors"
              >
                {PLATFORM_ICONS[post.platform] ?? "🔗"} {post.platform}
              </a>
            ))}
          </div>
        )}

        {/* Lede / summary */}
        {law.summary && (
          <>
            <p className="font-article text-[19.5px] leading-[1.68] text-ink-700 drop-cap mb-6">
              {law.summary.plainSpanish}
            </p>
            {law.summary.keyPoints[0] && (
              <blockquote className="border-l-4 border-honduras-red my-8 pl-6 py-1.5">
                <p className="font-serif italic font-bold text-2xl leading-snug text-ink">
                  "{law.summary.keyPoints[0]}"
                </p>
                <cite className="block not-italic text-xs font-semibold text-ink-500 mt-3 tracking-wide">
                  SÍNTESIS GENERADA DEL DECRETO {law.lawNumber}
                </cite>
              </blockquote>
            )}
            {law.summary.keyPoints.length > 1 && (
              <ul className="space-y-2 mb-9">
                {law.summary.keyPoints.slice(1).map((point, i) => (
                  <li key={i} className="font-article text-[17px] text-ink-700 leading-relaxed flex gap-3">
                    <span className="text-honduras-red font-bold">—</span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Analysis grid */}
      {law.analysis && (
        <section className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-3">
          <h2 className="font-serif font-black text-2xl mb-1.5">Análisis automatizado</h2>
          <p className="text-[13px] text-ink-500 mb-6">
            Desglose generado por IA del texto íntegro del decreto, organizado en cuatro dimensiones.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ANALYSIS_SECTIONS.map(({ key, title, color, text }) => (
              <div key={key} className={`bg-white border border-border border-l-4 ${color} p-6`}>
                <div className={`text-[11px] font-bold uppercase tracking-widest ${text} mb-2.5`}>
                  {title}
                </div>
                <p className="font-article text-[15.5px] leading-relaxed text-ink-700">
                  {law.analysis![key]}
                </p>
              </div>
            ))}
          </div>
          {law.analysis.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-500 mb-3">Fuentes consultadas</p>
              <ul className="space-y-2">
                {law.analysis.sources.map((src, i) => (
                  <li key={i} className="text-sm text-ink-500">
                    {src.url ? (
                      <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-honduras-blue hover:underline font-semibold">
                        {src.title}
                      </a>
                    ) : (
                      <span className="text-ink-700 font-semibold">{src.title}</span>
                    )}
                    {" — "}{src.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Impact by class */}
      {law.impactAnalysis && (
        <section className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-3">
          <h2 className="font-serif font-black text-2xl mb-5">Impacto por clase social</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: "Clase baja", content: law.impactAnalysis.poorImpact, border: "border-t-accent-green" },
              { label: "Clase media", content: law.impactAnalysis.middleImpact, border: "border-t-accent-amber" },
              { label: "Clase alta", content: law.impactAnalysis.wealthyImpact, border: "border-t-honduras-red" },
            ].map(({ label, content, border }) => (
              <div key={label} className={`bg-white border border-border border-t-[3px] ${border} p-5`}>
                <div className="text-[13px] font-bold text-ink mb-3">{label}</div>
                <p className="font-article text-[14.5px] leading-relaxed text-ink-500">{content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Constitutional verdict — dark card */}
      {law.constitutionalReview && (
        <section className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-3">
          <div className="bg-ink text-paper p-8">
            <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/10 pb-4 mb-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#8A8678]">
                  Veredicto constitucional
                </div>
                <div className="font-serif font-black text-2xl mt-1">
                  {law.constitutionalReview.isCompliant ? "Constitucional" : "Posible inconstitucionalidad"}
                </div>
              </div>
              <span className="text-3xl" aria-hidden="true">{law.constitutionalReview.isCompliant ? "✅" : "⚠️"}</span>
            </div>
            <p className="font-article text-base leading-relaxed text-[#D8D5CB] mb-5">
              {law.constitutionalReview.findings}
            </p>
            {law.constitutionalReview.articles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {law.constitutionalReview.articles.map((art, i) => (
                  <span
                    key={i}
                    className="text-xs font-semibold px-2.5 py-1.5 border border-white/20 rounded-full text-[#BDBAB0]"
                    title={`${art.title} — ${VERDICT_COLORS[art.verdict] ? art.verdict : ""}`}
                  >
                    {art.number} · {art.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Voting record */}
      {voteRows.length > 0 && (
        <section className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-16">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-4">
            <h2 className="font-serif font-black text-2xl">Registro de votación</h2>
            <span className="text-[13px] text-ink-500">
              {voteCounts.FOR} a favor · {voteCounts.AGAINST} en contra · {voteCounts.ABSTAIN} abstenciones
            </span>
          </div>
          <VotingTable rows={voteRows} />
        </section>
      )}

      {/* Transcripts */}
      {(law.transcripts?.length ?? 0) > 0 && (
        <section className="max-w-[880px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-serif font-black text-2xl mb-5">Transcripciones</h2>
          <div className="space-y-3">
            {law.transcripts?.map((t, i) => (
              <details key={i} className="border border-border">
                <summary className="px-6 py-4 cursor-pointer font-bold hover:bg-paper-200 transition-colors">
                  {t.type === "SESSION" ? "📋 Sesión del Congreso" : "🎤 Entrevista"} —{" "}
                  <a href={t.videoUrl} target="_blank" rel="noopener noreferrer" className="text-honduras-blue text-sm font-normal">
                    Ver video →
                  </a>
                </summary>
                <div className="px-6 pb-6">
                  <pre className="text-ink-500 text-sm whitespace-pre-wrap leading-relaxed font-sans max-h-64 overflow-y-auto">
                    {t.content}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
