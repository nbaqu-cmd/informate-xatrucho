import Image from "next/image";

export function PhotoPlaceholder({
  caption,
  height = 240,
  src,
}: {
  caption: string;
  height?: number;
  src?: string;
}) {
  if (src) {
    return (
      <div className="relative border border-border overflow-hidden" style={{ height }}>
        <Image src={src} alt={caption} fill className="object-cover" sizes="(max-width: 768px) 100vw, 760px" />
      </div>
    );
  }

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
