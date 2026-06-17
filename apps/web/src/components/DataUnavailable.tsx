export function DataUnavailable({ message }: { message?: string }) {
  return (
    <div className="py-16 text-center border border-dashed border-border bg-paper-200/40 text-ink-500" role="alert">
      <div className="font-serif font-bold text-lg text-ink mb-1.5">No se pudieron cargar los datos</div>
      <p className="text-sm max-w-md mx-auto leading-relaxed">
        {message ?? "Hubo un problema conectando con el servidor. Intenta recargar la página en unos segundos."}
      </p>
    </div>
  );
}
