import type { Metadata } from "next";
import Image from "next/image";
import { api } from "../../lib/api";
import { DataUnavailable } from "../../components/DataUnavailable";

export const metadata: Metadata = {
  title: "Congresistas",
  description:
    "Directorio de diputados del Congreso Nacional de Honduras con historial de votación nominal verificado.",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function CongresistasPage() {
  let congressmen: Awaited<ReturnType<typeof api.congressmen.list>> = [];
  let apiError = false;
  try {
    congressmen = await api.congressmen.list();
  } catch {
    apiError = true;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-honduras-blue">
        Directorio
      </div>
      <h1 className="font-serif font-black text-5xl mt-2 mb-2">Congresistas</h1>
      <p className="font-article text-ink-500 mb-10 text-lg max-w-[60ch]">
        {congressmen.length} diputados monitoreados — cada perfil rastrea su historial de
        votación nominal verificado.
      </p>

      {apiError ? (
        <DataUnavailable />
      ) : congressmen.length === 0 ? (
        <div className="py-20 text-center text-ink-500 border border-border">
          Sincronizando datos del Congreso Nacional...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {congressmen.map((c) => {
            const color = c.party.color ?? "#6E6A5E";
            return (
              <a key={c.id} href={`/congresistas/${c.id}`} className="group block">
                <div
                  className="aspect-square border border-border relative overflow-hidden flex items-center justify-center"
                  style={{
                    background: c.photoUrl
                      ? undefined
                      : `linear-gradient(150deg, ${color} 0%, #15171C 130%)`,
                  }}
                >
                  {c.photoUrl ? (
                    <Image
                      src={c.photoUrl}
                      alt={c.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                    />
                  ) : (
                    <span className="font-serif font-black text-4xl text-white/90">
                      {initials(c.name)}
                    </span>
                  )}
                  <span className="absolute left-0 right-0 bottom-0 h-1" style={{ background: color }} />
                </div>
                <div className="mt-3">
                  <div className="font-bold text-ink leading-tight group-hover:text-honduras-red transition-colors">
                    {c.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-500">
                    <span className="w-2 h-2" style={{ background: color }} />
                    {c.party.name}
                  </div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{c.district}</div>
                  <div className="flex gap-3 mt-2.5 pt-2.5 border-t border-border text-[11px] text-ink-500">
                    <span>{c._count.votes} votos</span>
                    <span>{c._count.appearances} apariciones</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
