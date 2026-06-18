import type { Metadata } from "next";
import { api } from "../../lib/api";
import { DataUnavailable } from "../../components/DataUnavailable";
import { CongresistasDirectory } from "../../components/CongresistasDirectory";

export const metadata: Metadata = {
  title: "Congresistas",
  description:
    "Directorio de diputados del Congreso Nacional de Honduras con historial de votación nominal verificado.",
};

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
        <CongresistasDirectory congressmen={congressmen} />
      )}
    </div>
  );
}
