import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export interface TikTokVideoProps {
  lawTitle: string;
  lawNumber: string;
  keyPoints: string[];
  poorImpact: string;
  middleImpact: string;
  wealthyImpact: string;
  isConstitutional: boolean;
  gazetteDate: string;
}

const COLORS = {
  bg: "#0A0A0A",
  primary: "#3B82F6",
  accent: "#F59E0B",
  danger: "#EF4444",
  success: "#10B981",
  text: "#F9FAFB",
  muted: "#9CA3AF",
};

function TitleSlide({ title, lawNumber, date }: { title: string; lawNumber: string; date: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = spring({ frame, fps, config: { damping: 20 } });
  const translateY = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.bg} 0%, #1a1a2e 100%)`,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ opacity, transform: `translateY(${translateY}px)`, textAlign: "center" }}>
        <div
          style={{
            background: COLORS.primary,
            borderRadius: 8,
            padding: "8px 16px",
            display: "inline-block",
            marginBottom: 16,
            fontSize: 24,
            color: "white",
            fontWeight: 700,
          }}
        >
          DECRETO {lawNumber}
        </div>
        <h1
          style={{
            color: COLORS.text,
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.2,
            margin: "0 0 16px",
          }}
        >
          {title}
        </h1>
        <p style={{ color: COLORS.muted, fontSize: 28 }}>{date}</p>
        <div
          style={{
            marginTop: 32,
            padding: "12px 24px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: 50,
            color: COLORS.accent,
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          📰 Infórmate Xatrucho
        </div>
      </div>
    </AbsoluteFill>
  );
}

function KeyPointSlide({ point, index, total }: { point: string; index: number; total: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        padding: 48,
        justifyContent: "center",
      }}
    >
      <div style={{ opacity }}>
        <div style={{ color: COLORS.primary, fontSize: 24, marginBottom: 16, fontWeight: 600 }}>
          PUNTO {index + 1} DE {total}
        </div>
        <p
          style={{
            color: COLORS.text,
            fontSize: 48,
            lineHeight: 1.4,
            fontWeight: 500,
          }}
        >
          {point}
        </p>
      </div>
    </AbsoluteFill>
  );
}

function ImpactSlide({ poorImpact, middleImpact }: { poorImpact: string; middleImpact: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{ background: "#0f172a", padding: 40, gap: 24, justifyContent: "center" }}
    >
      <div style={{ opacity }}>
        <h2 style={{ color: COLORS.accent, fontSize: 36, marginBottom: 32, fontWeight: 700 }}>
          ¿A QUIÉN AFECTA?
        </h2>
        <div
          style={{
            background: "rgba(59,130,246,0.1)",
            border: `2px solid ${COLORS.primary}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div style={{ color: COLORS.primary, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            👨‍👩‍👧 CLASE BAJA
          </div>
          <p style={{ color: COLORS.text, fontSize: 30, lineHeight: 1.4 }}>
            {poorImpact.slice(0, 200)}...
          </p>
        </div>
        <div
          style={{
            background: "rgba(245,158,11,0.1)",
            border: `2px solid ${COLORS.accent}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ color: COLORS.accent, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            👔 CLASE MEDIA
          </div>
          <p style={{ color: COLORS.text, fontSize: 30, lineHeight: 1.4 }}>
            {middleImpact.slice(0, 200)}...
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ConstitutionalSlide({ isCompliant }: { isCompliant: boolean }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        background: isCompliant ? "#052e16" : "#450a0a",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ opacity, textAlign: "center" }}>
        <div style={{ fontSize: 120 }}>{isCompliant ? "✅" : "⚠️"}</div>
        <h2
          style={{
            color: isCompliant ? COLORS.success : COLORS.danger,
            fontSize: 56,
            fontWeight: 800,
            marginTop: 24,
          }}
        >
          {isCompliant ? "CONSTITUCIONAL" : "POSIBLE INCONSTITUCIONALIDAD"}
        </h2>
        <p style={{ color: COLORS.muted, fontSize: 30, marginTop: 16 }}>
          {isCompliant
            ? "Esta ley es compatible con la Constitución"
            : "Esta ley podría violar artículos constitucionales"}
        </p>
      </div>
    </AbsoluteFill>
  );
}

function CallToActionSlide() {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary}, #1d4ed8)`,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2 style={{ color: "white", fontSize: 64, fontWeight: 800, marginBottom: 24 }}>
          ¡Comparte!
        </h2>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 36, lineHeight: 1.5 }}>
          El pueblo hondureño merece saber la verdad sobre sus leyes
        </p>
        <div
          style={{
            marginTop: 40,
            padding: "16px 32px",
            background: "white",
            borderRadius: 50,
            color: COLORS.primary,
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          @InformateXatrucho
        </div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 24, marginTop: 24 }}>
          🔗 Reporte completo en el enlace del perfil
        </p>
      </div>
    </AbsoluteFill>
  );
}

export const TikTokVideo: React.FC<TikTokVideoProps> = ({
  lawTitle,
  lawNumber,
  keyPoints,
  poorImpact,
  middleImpact,
  isConstitutional,
  gazetteDate,
}) => {
  const { fps } = useVideoConfig();
  const TITLE_DURATION = fps * 4;
  const POINT_DURATION = fps * 5;
  const IMPACT_DURATION = fps * 8;
  const CONSTITUTIONAL_DURATION = fps * 4;
  const CTA_DURATION = fps * 4;

  let offset = 0;
  const pointSequences = keyPoints.slice(0, 5).map((point, i) => {
    const seq = { start: offset, duration: POINT_DURATION, point, index: i };
    offset += POINT_DURATION;
    return seq;
  });

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={0} durationInFrames={TITLE_DURATION}>
        <TitleSlide title={lawTitle} lawNumber={lawNumber} date={gazetteDate} />
      </Sequence>

      {pointSequences.map(({ start, duration, point, index }) => (
        <Sequence key={index} from={TITLE_DURATION + start} durationInFrames={duration}>
          <KeyPointSlide
            point={point}
            index={index}
            total={Math.min(keyPoints.length, 5)}
          />
        </Sequence>
      ))}

      <Sequence
        from={TITLE_DURATION + offset}
        durationInFrames={IMPACT_DURATION}
      >
        <ImpactSlide poorImpact={poorImpact} middleImpact={middleImpact} />
      </Sequence>

      <Sequence
        from={TITLE_DURATION + offset + IMPACT_DURATION}
        durationInFrames={CONSTITUTIONAL_DURATION}
      >
        <ConstitutionalSlide isCompliant={isConstitutional} />
      </Sequence>

      <Sequence
        from={TITLE_DURATION + offset + IMPACT_DURATION + CONSTITUTIONAL_DURATION}
        durationInFrames={CTA_DURATION}
      >
        <CallToActionSlide />
      </Sequence>
    </AbsoluteFill>
  );
};
