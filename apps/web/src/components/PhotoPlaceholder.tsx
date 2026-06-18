import Image from "next/image";

export function PhotoPlaceholder({
  caption,
  height = 240,
  src,
  aspectVideo = false,
}: {
  caption: string;
  height?: number;
  src?: string;
  /** Render a true 16:9 box instead of a fixed height — use for the generated
   *  covers (which are 16:9) so the full design shows without cropping. */
  aspectVideo?: boolean;
}) {
  // Covers are exactly 16:9, so a 16:9 box shows the whole design (masthead,
  // number, footer) with no crop; object-contain guards against any mismatch.
  const sizeClass = aspectVideo ? "aspect-video" : "";
  const sizeStyle = aspectVideo ? undefined : { height };
  const fitClass = aspectVideo ? "object-contain bg-paper-100" : "object-cover";

  if (src) {
    return (
      <div className={`relative border border-border overflow-hidden ${sizeClass}`} style={sizeStyle}>
        <Image src={src} alt={caption} fill className={fitClass} sizes="(max-width: 768px) 100vw, 900px" />
      </div>
    );
  }

  return (
    <div
      className={`border border-border flex items-center justify-center ${sizeClass}`}
      style={{
        ...sizeStyle,
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
