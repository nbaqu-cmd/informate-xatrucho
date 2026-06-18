import React from "react";
import {
  AbsoluteFill,
  Audio,
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
}

export interface WebExplainerProps {
  lawTitle: string;
  lawNumber: string;
  gazetteDate: string;
  isConstitutional: boolean;
  intro: { onScreen: string; audioFile: string; durationInFrames: number };
  sections: ExplainerSegment[];
  outro: { onScreen: string; audioFile: string; durationInFrames: number };
  /** sum of all segment durations; drives the composition length */
  totalFrames: number;
}

/** Subtle fade+rise used on every text block as it enters. */
function useEnter(delay = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 20 });
  const translateY = interpolate(opacity, [0, 1], [24, 0]);
  return { opacity, transform: `translateY(${translateY}px)` };
}

function BrandMark() {
  return (
    <div style={{ position: "absolute", top: 56, left: 80, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ display: "flex", gap: 4 }}>
        <span style={{ width: 10, height: 10, background: COLORS.blue }} />
        <span style={{ width: 10, height: 10, background: COLORS.red }} />
        <span style={{ width: 10, height: 10, background: COLORS.blue }} />
      </div>
      <span style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: COLORS.ink, letterSpacing: 0.5 }}>
        Infórmate <span style={{ fontStyle: "italic" }}>Xatrucho</span>
      </span>
    </div>
  );
}

function ProgressDots({ index, total }: { index: number; total: number }) {
  return (
    <div style={{ position: "absolute", bottom: 56, left: 80, display: "flex", gap: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          style={{
            width: i === index ? 34 : 12,
            height: 6,
            borderRadius: 3,
            background: i === index ? COLORS.red : COLORS.border,
            transition: "all 0.3s",
          }}
        />
      ))}
    </div>
  );
}

function IntroCard({ title, lawNumber, date, onScreen }: { title: string; lawNumber: string; date: string; onScreen: string }) {
  const enter = useEnter(4);
  const lineEnter = useEnter(16);
  return (
    <AbsoluteFill style={{ background: COLORS.paper, padding: "80px 80px 120px", justifyContent: "center" }}>
      <BrandMark />
      <div style={{ ...enter }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
          <span style={{ background: COLORS.red, color: "white", fontSize: 24, fontWeight: 700, padding: "8px 20px", letterSpacing: 1, textTransform: "uppercase" }}>
            Decreto {lawNumber}
          </span>
          <span style={{ color: COLORS.ink500, fontSize: 24 }}>{date}</span>
        </div>
        <h1 style={{ fontFamily: "Georgia, serif", color: COLORS.ink, fontSize: 84, fontWeight: 800, lineHeight: 1.08, margin: 0, maxWidth: 1500 }}>
          {title}
        </h1>
      </div>
      <div style={{ ...lineEnter, marginTop: 48, borderTop: `2px solid ${COLORS.border}`, paddingTop: 28, maxWidth: 1300 }}>
        <p style={{ fontFamily: "Georgia, serif", color: COLORS.ink700, fontSize: 38, lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
          {onScreen}
        </p>
      </div>
    </AbsoluteFill>
  );
}

function SectionCard({
  segment,
  index,
  total,
}: {
  segment: ExplainerSegment;
  index: number;
  total: number;
}) {
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
        <div
          style={{
            color: headingColor,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          {segment.heading}
        </div>
        <h2
          style={{
            fontFamily: "Georgia, serif",
            color: textColor,
            fontSize: isAlert ? 76 : 72,
            fontWeight: 800,
            lineHeight: 1.14,
            margin: 0,
            maxWidth: 1600,
            ...bodyEnter,
          }}
        >
          {segment.onScreen}
        </h2>
      </div>
      <ProgressDots index={index} total={total} />
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
    { kind: "intro" as const, audioFile: props.intro.audioFile, durationInFrames: props.intro.durationInFrames },
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
              <IntroCard title={props.lawTitle} lawNumber={props.lawNumber} date={props.gazetteDate} onScreen={props.intro.onScreen} />
            )}
            {seg.kind === "section" && (
              <SectionCard segment={seg} index={i - 1} total={props.sections.length} />
            )}
            {seg.kind === "outro" && <OutroCard onScreen={props.outro.onScreen} />}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
