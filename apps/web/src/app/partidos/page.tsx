import type { Metadata } from "next";
import { api } from "../../lib/api";
import { DataUnavailable } from "../../components/DataUnavailable";

export const metadata: Metadata = {
  title: "Partidos",
  description: "Distribución de curules y comportamiento de voto agregado por bancada en el Congreso Nacional de Honduras.",
};

export default async function PartidosPage() {
  let parties: Awaited<ReturnType<typeof api.parties.list>> = [];
  let apiError = false;
  try {
    parties = await api.parties.list();
  } catch {
    apiError = true;
  }

  const totalSeats = parties.reduce((sum, p) => sum + p._count.congressmen, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-honduras-blue">
        Bancadas
      </div>
      <h1 className="font-serif font-black text-5xl mt-2 mb-2">Partidos en el Congreso</h1>
      <p className="font-article text-ink-500 mb-10 text-lg max-w-[60ch]">
        Distribución de curules y comportamiento de voto agregado por bancada.
      </p>

      {apiError ? (
        <DataUnavailable />
      ) : parties.length === 0 ? (
        <div className="py-20 text-center text-ink-500 border border-border">
          Cargando datos de partidos...
        </div>
      ) : (
        <div className="space-y-4">
          {parties.map((party) => {
            const color = party.color ?? "#6E6A5E";
            const pct = totalSeats > 0 ? Math.round((party._count.congressmen / totalSeats) * 100) : 0;
            return (
              <div
                key={party.id}
                className="bg-white border border-border p-6"
                style={{ borderLeftWidth: 5, borderLeftColor: color }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 items-center">
                  <div className="col-span-2 sm:col-span-1">
                    <div className="font-serif font-bold text-xl text-ink">{party.name}</div>
                    <div
                      className="text-xs font-bold uppercase tracking-widest mt-1"
                      style={{ color }}
                    >
                      {party.abbreviation}
                    </div>
                  </div>
                  <Stat value={party._count.congressmen} label="Curules" />
                  <Stat value={party._count.votes} label="Votos registrados" color="#0073CF" />
                  <Stat value={`${pct}%`} label="Peso en el pleno" color={color} />
                </div>
                <div className="mt-5">
                  <div className="flex justify-between text-[11px] text-ink-500 mb-1.5">
                    <span>Peso en el pleno</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-paper-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, color }: { value: number | string; color?: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="font-serif font-black text-3xl leading-none"
        style={{ color: color ?? "#15171C" }}
      >
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-ink-500 mt-1">{label}</div>
    </div>
  );
}
