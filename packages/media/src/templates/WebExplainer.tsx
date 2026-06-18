import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const COLORS = {
  paper: "#FAF7F0",
  paper200: "#F3EEE2",
  ink: "#15171C",
  ink700: "#2A2A28",
  ink500: "#6E6A5E",
  border: "#DED7C7",
  red: "#CE1126",
  redDark: "#9E0E1F",
  blue: "#0073CF",
  green: "#1F7A4D",
  amber: "#A66A00",
};

export interface ExplainerSegment {
  heading: string;
  onScreen: string;
  tone: "neutral" | "alert";
  /** filename of the segment's narration mp3, resolved via staticFile() */
  audioFile: string;
  durationInFrames: number;
  /** optional filename of a verified illustrative image for this segment */
  imageFile?: string;
  /** attribution shown small over the image (CC requires it) */
  imageCredit?: string;
}

export interface WebExplainerProps {
  lawTitle: string;
  lawNumber: string;
  gazetteDate: string;
  isConstitutional: boolean;
  intro: { onScreen: string; audioFile: string; durationInFrames: number; imageFile?: string; imageCredit?: string };
  sections: ExplainerSegment[];
  outro: { onScreen: string; audioFile: string; durationInFrames: number };
  /** sum of all segment durations; drives the composition length */
  totalFrames: number;
}

function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 20 });
  const translateY = interpolate(opacity, [0, 1], [24, 0]);
  return { opacity, transform: `translateY(${translateY}px)` };
}

/** Slow Ken Burns zoom so static photos feel alive, like a TV news package. */
function KenBurnsImage({ file, durationInFrames }: { file: string; durationInFrames: number }) {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, durationInFrames], [1.06, 1.14], { extrapolateRight: "clamp" });
  const translateX = interpolate(frame, [0, durationInFrames], [-12, 12], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: COLORS.ink }}>
      <Img
        src={staticFile(file)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translateX(${translateX}px)`,
        }}
      />
    </AbsoluteFill>
  );
}

function ImageCredit({ credit }: { credit?: string }) {
  if (!credit) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 18,
        right: 28,
        color: "rgba(255,255,255,0.7)",
        fontSize: 18,
        letterSpacing: 0.3,
        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
      }}
    >
      {credit}
    </div>
  );
}

function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div style={{ position: "absolute", top: 56, left: 80, display: "flex", alignItems: "center", gap: 14, zIndex: 2 }}>
      <div style={{ display: "flex", gap: 4 }}>
        <span style={{ width: 10, height: 10, background: COLORS.blue }} />
        <span style={{ width: 10, height: 10, background: COLORS.red }} />
        <span style={{ width: 10, height: 10, background: COLORS.blue }} />
      </div>
      <span
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 26,
          fontWeight: 700,
          color: light ? "#fff" : COLORS.ink,
          letterSpacing: 0.5,
          textShadow: light ? "0 1px 6px rgba(0,0,0,0.6)" : "none",
        }}
      >
        Infórmate <span style={{ fontStyle: "italic" }}>Xatrucho</span>
      </span>
    </div>
  );
}

function ProgressDots({ index, total, light = false }: { index: number; total: number; light?: boolean }) {
  return (
    <div style={{ position: "absolute", bottom: 56, left: 80, display: "flex", gap: 10, zIndex: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === index ? 34 : 12,
            height: 6,
            borderRadius: 3,
            background: i === index ? COLORS.red : light ? "rgba(255,255,255,0.4)" : COLORS.border,
          }}
        />
      ))}
    </div>
  );
}

/** Documentary lower-third over a photo: heading kicker + the key sentence. */
function LowerThird({ heading, onScreen, alert = false }: { heading: string; onScreen: string; alert?: boolean }) {
  const enter = useEnter(6);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div
        style={{
          background: alert
            ? "linear-gradient(to top, rgba(158,14,31,0.97) 0%, rgba(158,14,31,0.85) 55%, rgba(158,14,31,0) 100%)"
            : "linear-gradient(to top, rgba(10,12,16,0.96) 0%, rgba(10,12,16,0.78) 55%, rgba(10,12,16,0) 100%)",
          padding: "180px 80px 90px",
        }}
      >
        <div style={{ ...enter }}>
          <div
            style={{
              display: "inline-block",
              background: alert ? "#fff" : COLORS.red,
              color: alert ? COLORS.redDark : "#fff",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "6px 18px",
              marginBottom: 22,
            }}
          >
            {alert ? "⚠ Alerta constitucional" : heading}
          </div>
          <h2
            style={{
              fontFamily: "Georgia, serif",
              color: "#fff",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
              maxWidth: 1600,
              textShadow: "0 2px 12px rgba(0,0,0,0.5)",
            }}
          >
            {onScreen}
          </h2>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function IntroCard({
  title,
  lawNumber,
  date,
  onScreen,
  imageFile,
  imageCredit,
  durationInFrames,
}: {
  title: string;
  lawNumber: string;
  date: string;
  onScreen: string;
  imageFile?: string;
  imageCredit?: string;
  durationInFrames: number;
}) {
  const enter = useEnter(4);
  const lineEnter = useEnter(16);
  return (
    <AbsoluteFill style={{ background: COLORS.paper }}>
      {imageFile && (
        <AbsoluteFill style={{ height: "52%" }}>
          <KenBurnsImage file={imageFile} durationInFrames={durationInFrames} />
          <ImageCredit credit={imageCredit} />
        </AbsoluteFill>
      )}
      <AbsoluteFill
        style={{
          top: imageFile ? "52%" : 0,
          padding: "64px 80px",
          justifyContent: "center",
          background: COLORS.paper,
        }}
      >
        <BrandMark />
        <div style={{ ...enter }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 24 }}>
            <span style={{ background: COLORS.red, color: "white", fontSize: 24, fontWeight: 700, padding: "8px 20px", letterSpacing: 1, textTransform: "uppercase" }}>
              Decreto {lawNumber}
            </span>
            <span style={{ color: COLORS.ink500, fontSize: 24 }}>{date}</span>
          </div>
          <h1 style={{ fontFamily: "Georgia, serif", color: COLORS.ink, fontSize: imageFile ? 60 : 84, fontWeight: 800, lineHeight: 1.08, margin: 0, maxWidth: 1500 }}>
            {title}
          </h1>
          <div style={{ ...lineEnter, marginTop: 28, borderTop: `2px solid ${COLORS.border}`, paddingTop: 22, maxWidth: 1300 }}>
            <p style={{ fontFamily: "Georgia, serif", color: COLORS.ink700, fontSize: 34, lineHeight: 1.45, margin: 0, fontStyle: "italic" }}>
              {onScreen}
            </p>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Text-only card used when a section has no verified image. */
function TextCard({ segment, index, total }: { segment: ExplainerSegment; index: number; total: number }) {
  const enter = useEnter(4);
  const bodyEnter = useEnter(18);
  const isAlert = segment.tone === "alert";
  const bg = isAlert ? COLORS.red : COLORS.paper;
  const headingColor = isAlert ? "rgba(255,255,255,0.85)" : COLORS.red;
  const textColor = isAlert ? "white" : COLORS.ink;
  return (
    <AbsoluteFill style={{ background: bg, padding: "80px 80px 120px", justifyContent: "center" }}>
      {!isAlert && <BrandMark />}
      {isAlert && (
        <div style={{ position: "absolute", top: 56, left: 80, display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <span style={{ color: "white", fontSize: 26, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
            Alerta constitucional
          </span>
        </div>
      )}
      <div style={{ ...enter }}>
        <div style={{ color: headingColor, fontSize: 28, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
          {segment.heading}
        </div>
        <h2 style={{ fontFamily: "Georgia, serif", color: textColor, fontSize: isAlert ? 76 : 72, fontWeight: 800, lineHeight: 1.14, margin: 0, maxWidth: 1600, ...bodyEnter }}>
          {segment.onScreen}
        </h2>
      </div>
      <ProgressDots index={index} total={total} />
    </AbsoluteFill>
  );
}

function SectionCard({ segment, index, total }: { segment: ExplainerSegment; index: number; total: number }) {
  if (!segment.imageFile) return <TextCard segment={segment} index={index} total={total} />;
  const isAlert = segment.tone === "alert";
  return (
    <AbsoluteFill style={{ background: COLORS.ink }}>
      <KenBurnsImage file={segment.imageFile} durationInFrames={segment.durationInFrames} />
      <ImageCredit credit={segment.imageCredit} />
      <BrandMark light />
      <LowerThird heading={segment.heading} onScreen={segment.onScreen} alert={isAlert} />
      <ProgressDots index={index} total={total} light />
    </AbsoluteFill>
  );
}

function OutroCard({ onScreen }: { onScreen: string }) {
  const enter = useEnter(4);
  return (
    <AbsoluteFill style={{ background: COLORS.ink, alignItems: "center", justifyContent: "center", padding: 80 }}>
      <div style={{ ...enter, textAlign: "center", maxWidth: 1400 }}>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
          <span style={{ width: 14, height: 14, background: COLORS.blue }} />
          <span style={{ width: 14, height: 14, background: COLORS.red }} />
          <span style={{ width: 14, height: 14, background: COLORS.blue }} />
        </div>
        <h2 style={{ fontFamily: "Georgia, serif", color: COLORS.paper, fontSize: 72, fontWeight: 800, margin: "0 0 28px" }}>
          Infórmate <span style={{ fontStyle: "italic" }}>Xatrucho</span>
        </h2>
        <p style={{ fontFamily: "Georgia, serif", color: "#C9C4B6", fontSize: 38, lineHeight: 1.5, margin: 0 }}>
          {onScreen}
        </p>
        <p style={{ color: "#9A9384", fontSize: 26, marginTop: 36, letterSpacing: 1 }}>
          Transparencia legislativa · Sin sesgos · Solo la verdad
        </p>
      </div>
    </AbsoluteFill>
  );
}

export const WebExplainer: React.FC<WebExplainerProps> = (props) => {
  const segments = [
    {
      kind: "intro" as const,
      audioFile: props.intro.audioFile,
      durationInFrames: props.intro.durationInFrames,
    },
    ...props.sections.map((s) => ({ kind: "section" as const, ...s })),
    { kind: "outro" as const, audioFile: props.outro.audioFile, durationInFrames: props.outro.durationInFrames },
  ];

  let offset = 0;
  return (
    <AbsoluteFill style={{ background: COLORS.paper }}>
      {segments.map((seg, i) => {
        const from = offset;
        offset += seg.durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={seg.durationInFrames}>
            {seg.audioFile && <Audio src={staticFile(seg.audioFile)} />}
            {seg.kind === "intro" && (
              <IntroCard
                title={props.lawTitle}
                lawNumber={props.lawNumber}
                date={props.gazetteDate}
                onScreen={props.intro.onScreen}
                imageFile={props.intro.imageFile}
                imageCredit={props.intro.imageCredit}
                durationInFrames={props.intro.durationInFrames}
              />
            )}
            {seg.kind === "section" && <SectionCard segment={seg} index={i - 1} total={props.sections.length} />}
            {seg.kind === "outro" && <OutroCard onScreen={props.outro.onScreen} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
