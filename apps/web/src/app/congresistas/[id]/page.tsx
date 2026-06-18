import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import { formatDate } from "../../../lib/utils";

function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const c = await api.congressmen.get(params.id);
    return { title: c.name, description: `Perfil de ${c.name}, diputado por ${c.party.name} en el Congreso Nacional de Honduras.` };
  } catch {
    return { title: "Diputado no encontrado" };
  }
}

const VOTE_LABEL: Record<string, string> = { FOR: "A favor", AGAINST: "En contra", ABSTAIN: "Abstención", ABSENT: "Ausente" };

export default async function CongresistaDetailPage({ params }: { params: { id: string } }) {
  let c;
  try {
    c = await api.congressmen.get(params.id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const color = c.party.color ?? "#6E6A5E";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <a href="/congresistas" className="text-xs uppercase tracking-widest font-bold text-ink-500 hover:text-honduras-red transition-colors">
        ← Directorio
      </a>

      <div className="flex flex-col sm:flex-row gap-6 mt-6 mb-10">
        <div
          className="w-32 h-32 shrink-0 border border-border relative overflow-hidden flex items-center justify-center"
          style={{ background: c.photoUrl ? undefined : `linear-gradient(150deg, ${color} 0%, #15171C 130%)` }}
        >
          {c.photoUrl ? (
            <Image src={c.photoUrl} alt={c.name} fill className="object-cover" />
          ) : (
            <span className="font-serif font-black text-4xl text-white/90">{initials(c.name)}</span>
          )}
          <span className="absolute left-0 right-0 bottom-0 h-1" style={{ background: color }} />
        </div>
        <div>
          <h1 className="font-serif font-black text-4xl leading-tight">{c.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="w-2.5 h-2.5" style={{ background: color }} />
            <span className="font-semibold text-ink">{c.party.name}</span>
            <span className="text-ink-300">({c.party.abbreviation})</span>
          </div>
          {c.district && <div className="text-ink-500 text-sm mt-1">Departamento: {c.district}</div>}
        </div>
      </div>

      {/* Voting record, honest about data availability */}
      <section className="mb-10">
        <h2 className="font-serif font-black text-2xl mb-4">Historial de votación</h2>
        {c.votes.length > 0 ? (
          <div className="border border-border divide-y divide-border">
            {c.votes.map((v, i) => (
              <a key={i} href={`/leyes/${v.law.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-paper-200 transition-colors">
                <span className="font-medium text-ink text-sm">{v.law.title}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-ink-500 shrink-0">{VOTE_LABEL[v.vote] ?? v.vote}</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="border border-border bg-paper-200/40 p-6">
            <p className="font-article text-[15px] text-ink-700 leading-relaxed">
              No mostramos un historial de votación para este diputado porque{" "}
              <strong>el Congreso Nacional de Honduras no publica de forma oficial el voto nominal
              (quién votó qué) de cada decreto.</strong>{" "}
              Para no inventar datos, dejamos este apartado vacío hasta que exista una fuente
              oficial y verificable del voto individual.
            </p>
            <a href="/metodologia" className="inline-block mt-3 text-honduras-blue font-bold text-sm hover:underline">
              Cómo trabajamos y qué datos usamos →
            </a>
          </div>
        )}
      </section>

      {c.appearances.length > 0 && (
        <section>
          <h2 className="font-serif font-black text-2xl mb-4">Apariciones</h2>
          <div className="space-y-2">
            {c.appearances.map((a, i) => (
              <a key={i} href={`/leyes/${a.law.id}`} className="block border border-border px-4 py-3 hover:bg-paper-200 transition-colors text-sm">
                {a.law.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
