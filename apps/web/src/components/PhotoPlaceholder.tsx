export function PhotoPlaceholder({
  caption,
  height = 240,
}: {
  caption: string;
  height?: number;
}) {
  return (
    <div
      className="border border-border flex items-center justify-center"
      style={{
        height,
        background:
          "repeating-linear-gradient(135deg, #ECE4D4, #ECE4D4 11px, #E3D9C5 11px, #E3D9C5 22px)",
      }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#A89B82] px-4 text-center">
        {caption}
      </span>
    </div>
  );
}
