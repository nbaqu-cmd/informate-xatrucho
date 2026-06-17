import type { Metadata } from "next";
import { api } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import { DataUnavailable } from "../../components/DataUnavailable";

export const metadata: Metadata = {
  title: "Alertas legislativas",
  description: "Patrones detectados automáticamente: cambios de redacción, conflictos de interés y posibles inconstitucionalidades, ordenados por severidad.",
};

const SEVERITY_STYLES: Record<string, { border: string; bg: string; label: string }> = {
  LOW: { border: "border-honduras-blue", bg: "bg-honduras-blue", label: "Baja" },
  MEDIUM: { border: "border-accent-amber", bg: "bg-accent-amber", label: "Media" },
  HIGH: { border: "border-orange-600", bg: "bg-orange-600", label: "Alta" },
  CRITICAL: { border: "border-honduras-red", bg: "bg-honduras-red", label: "Crítica" },
};

const TYPE_ICONS: Record<string, string> = {
  PATTERN: "📊",
  ANOMALY: "🔴",
  AGENDA: "🎯",
};

export default async function AlertasPage() {
  let alerts: Awaited<ReturnType<typeof api.alerts.list>> = [];
  let apiError = false;
  try {
    alerts = await api.alerts.list();
  } catch {
    apiError = true;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-honduras-red">
        Vigilancia activa
      </div>
      <h1 className="font-serif font-black text-5xl mt-2 mb-2">Alertas legislativas</h1>
      <p className="font-article text-ink-500 mb-10 text-lg max-w-[62ch]">
        Patrones detectados automáticamente por el sistema: cambios de redacción, conflictos de
        interés y posibles inconstitucionalidades. Ordenadas por severidad.
      </p>

      {apiError ? (
        <DataUnavailable />
      ) : alerts.length === 0 ? (
        <div className="py-20 text-center border border-border">
          <div className="text-5xl mb-4" aria-hidden="true">🔍</div>
          <div className="font-serif font-bold text-xl mb-2">Sin alertas activas</div>
          <div className="text-ink-500 text-sm">
            El sistema analizará patrones a medida que se procesen más leyes
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const severity = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES["LOW"]!;
            return (
              <article
                key={alert.id}
                className={`bg-white border border-border border-l-[5px] ${severity.border} p-6 hover:bg-paper-200/40 transition-colors`}
              >
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 text-white ${severity.bg}`}>
                    Severidad {severity.label}
                  </span>
                  <span className="text-xs font-bold text-ink-500 uppercase tracking-wide flex items-center gap-1">
                    {TYPE_ICONS[alert.type] ?? "⚠️"} {alert.type}
                  </span>
                  <span className="ml-auto text-xs text-ink-500">{formatDate(alert.createdAt)}</span>
                </div>
                <p className="font-article text-[17px] text-ink-700 leading-relaxed">{alert.description}</p>
                {(alert.parties as string[]).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 items-center">
                    <span className="text-xs uppercase tracking-wide font-bold text-ink-500">Partidos:</span>
                    {(alert.parties as string[]).map((p) => (
                      <span key={p} className="text-xs bg-paper-200 text-ink-700 px-2 py-1">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
