import type { Metadata } from "next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { StatusBadge } from "../../components/StatusBadge";
import { STATUS_STYLES } from "../../lib/status";
import { DataUnavailable } from "../../components/DataUnavailable";

export const metadata: Metadata = {
  title: "Leyes de Honduras",
  description:
    "Archivo completo de decretos del Congreso Nacional de Honduras, analizados automáticamente por IA: causas, efectos, impacto social y constitucionalidad.",
};

const FILTERS = ["", "COMPLETE", "ANALYZING", "PENDING", "FAILED"];

export default async function LeyesPage({
  searchParams,
}: {
  searchParams: { page?: string; status?: string };
}) {
  const page = Number(searchParams.page ?? 1);
  const status = searchParams.status;

  let laws: Awaited<ReturnType<typeof api.laws.list>> = {
    laws: [],
    total: 0,
    page: 1,
    limit: 20,
  };
  let apiError = false;

  try {
    laws = await api.laws.list({ page, status });
  } catch {
    apiError = true;
  }

  const totalPages = Math.ceil(laws.total / laws.limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-honduras-blue">
        Archivo legislativo
      </div>
      <h1 className="font-serif font-black text-5xl mt-2 mb-2">Leyes de Honduras</h1>
      <p className="font-article text-ink-500 mb-10 text-lg max-w-[60ch]">
        {laws.total} decretos analizados automáticamente, ordenados por fecha de detección y
        etapa del pipeline.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-2 border-t border-b border-border py-4">
        {FILTERS.map((s) => (
          <a
            key={s || "all"}
            href={s ? `/leyes?status=${s}` : "/leyes"}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors border ${
              status === s || (!status && !s)
                ? "bg-ink text-paper border-ink"
                : "bg-transparent text-ink-700 border-border hover:border-ink"
            }`}
          >
            {s ? (STATUS_STYLES[s]?.label ?? s) : "Todas"}
          </a>
        ))}
      </div>

      {apiError ? (
        <DataUnavailable />
      ) : laws.laws.length === 0 ? (
        <div className="py-20 text-center text-ink-500 border border-border mt-6">
          No hay leyes procesadas aún en esta categoría.
        </div>
      ) : (
        <div>
          {laws.laws.map((law, i) => (
            <a
              key={law.id}
              href={`/leyes/${law.id}`}
              className="grid grid-cols-1 sm:grid-cols-[60px_1fr_auto] gap-4 sm:gap-7 py-6 border-b border-border hover:bg-paper-200/50 transition-colors px-2 -mx-2"
            >
              <div className="font-serif font-black text-3xl text-[#C9BEA6] hidden sm:block">
                {String((page - 1) * laws.limit + i + 1).padStart(2, "0")}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <StatusBadge status={law.status} size="sm" />
                  <span className="text-[11px] text-ink-500">
                    Decreto {law.lawNumber} · Gaceta No. {law.gazetteNumber}
                  </span>
                </div>
                <h2 className="font-serif font-bold text-2xl leading-snug mb-1.5 group-hover:text-honduras-red text-balance">
                  {law.title}
                </h2>
                {law.summary?.keyPoints && (
                  <p className="font-article text-ink-500 text-[15px] line-clamp-1 max-w-2xl">
                    {(law.summary.keyPoints as string[])[0]}
                  </p>
                )}
              </div>
              <div className="flex sm:flex-col items-start sm:items-end justify-between gap-2 sm:gap-1 text-right">
                <span className="text-[13px] text-ink-500 whitespace-nowrap">{formatDate(law.gazetteDate)}</span>
                <span className="text-honduras-red font-bold text-sm uppercase tracking-wide whitespace-nowrap">
                  Leer →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mt-12 pt-8 border-t border-border">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/leyes?page=${p}${status ? `&status=${status}` : ""}`}
              className={`w-10 h-10 flex items-center justify-center font-serif font-bold text-sm transition-colors ${
                p === page ? "bg-ink text-paper" : "bg-paper-200 text-ink-700 hover:bg-ink/10"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
