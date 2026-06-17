import { getStatusStyle } from "../lib/status";

export function StatusBadge({ status, size = "md" }: { status: string; size?: "sm" | "md" }) {
  const s = getStatusStyle(status);
  const padding = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full ${padding}`}
      style={{ color: s.color, background: s.bg }}
    >
      <span
        className={`rounded-full ${dotSize} ${s.pulse ? "animate-pulse-dot" : ""}`}
        style={{ background: s.color }}
      />
      {s.label}
    </span>
  );
}
