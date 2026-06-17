"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="font-serif font-black text-3xl mb-3">Algo salió mal</div>
      <p className="text-ink-500 mb-8">
        Ocurrió un error inesperado al cargar esta página. Esto ya quedó registrado.
      </p>
      <button
        onClick={reset}
        className="bg-ink text-paper px-6 py-3 font-bold text-sm uppercase tracking-wide hover:bg-ink/85 transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}
