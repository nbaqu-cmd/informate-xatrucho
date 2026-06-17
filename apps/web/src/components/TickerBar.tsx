"use client";

export interface TickerItem {
  id: string;
  label: string;
}

export function TickerBar({ items }: { items: TickerItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-ink text-paper text-xs sm:text-sm font-medium py-2.5 px-4 flex items-center gap-3">
        <LiveBadge />
        <span className="text-[#8A8678]">
          Monitoreando Diario La Gaceta y el Congreso Nacional en tiempo real...
        </span>
      </div>
    );
  }

  // Duplicate items so the marquee loops seamlessly
  const looped = [...items, ...items];

  return (
    <div className="bg-ink text-paper overflow-hidden flex items-stretch border-b border-white/10">
      <div className="flex-shrink-0 bg-honduras-red px-3 sm:px-4 flex items-center gap-2 z-10">
        <LiveBadge />
      </div>
      <div
        className="overflow-hidden flex-1"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent)",
        }}
      >
        <div className="marquee-track whitespace-nowrap text-xs sm:text-sm">
          {looped.map((item, i) => (
            <a
              key={`${item.id}-${i}`}
              href={`/leyes/${item.id}`}
              className="hover:text-[#ff7884] transition-colors flex items-center gap-2.5 px-5 py-2.5"
            >
              <span className="text-honduras-red text-[8px]">●</span>
              <span className="text-[#8A8678] font-semibold tracking-wide text-[11px]">
                PROCESANDO
              </span>
              <span className="text-[#E8E5DC]">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-white font-bold text-[11px] uppercase tracking-[0.14em]">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
      En vivo
    </span>
  );
}
