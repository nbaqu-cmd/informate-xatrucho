import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

export interface YouTubeVideoProps {
  lawTitle: string;
  lawNumber: string;
  gazetteDate: string;
  summary: string;
  keyPoints: string[];
  causes: string;
  effects: string;
  benefits: string;
  drawbacks: string;
  poorImpact: string;
  middleImpact: string;
  wealthyImpact: string;
  constitutionalFindings: string;
  isConstitutional: boolean;
}

const COLORS = {
  bg: "#0A0A0A",
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  accent: "#F59E0B",
  danger: "#EF4444",
  success: "#10B981",
  text: "#F9FAFB",
  muted: "#9CA3AF",
  card: "#111827",
};

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 20 } });

  return (
    <div
      style={{
        opacity,
        borderLeft: `6px solid ${COLORS.primary}`,
        paddingLeft: 24,
        marginBottom: 32,
      }}
    >
      <h2 style={{ color: COLORS.text, fontSize: 48, fontWeight: 800, margin: 0 }}>
        {icon} {title}
      </h2>
    </div>
  );
}

function TextSection({
  title,
  icon,
  content,
  accentColor = COLORS.primary,
}: {
  title: string;
  icon: string;
  content: string;
  accentColor?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 20 } });
  const translateX = interpolate(frame, [0, 20], [-30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: COLORS.bg, padding: "80px 120px", justifyContent: "center" }}>
      <div style={{ opacity, transform: `translateX(${translateX}px)` }}>
        <div
          style={{
            borderLeft: `8px solid ${accentColor}`,
            paddingLeft: 32,
            marginBottom: 40,
          }}
        >
          <h2 style={{ color: COLORS.text, fontSize: 56, fontWeight: 800, margin: 0 }}>
            {icon} {title}
          </h2>
        </div>
        <p style={{ color: COLORS.text, fontSize: 36, lineHeight: 1.7, margin: 0 }}>
          {content.slice(0, 600)}
          {content.length > 600 ? "..." : ""}
        </p>
      </div>
    </AbsoluteFill>
  );
}

function IntroSlide({ title, lawNumber, date }: { title: string; lawNumber: string; date: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)`,
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 120px",
      }}
    >
      <div style={{ opacity, width: "100%", maxWidth: 1400 }}>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <span
            style={{
              background: COLORS.primary,
              color: "white",
              padding: "8px 24px",
              borderRadius: 8,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            DECRETO {lawNumber}
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.1)",
              color: COLORS.muted,
              padding: "8px 24px",
              borderRadius: 8,
              fontSize: 28,
            }}
          >
            {date}
          </span>
        </div>
        <h1
          style={{
            color: COLORS.text,
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.15,
            margin: "0 0 40px",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            background: "rgba(59,130,246,0.15)",
            border: `2px solid ${COLORS.primary}`,
            borderRadius: 16,
            padding: "24px 32px",
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 32 }}>📺</span>
          <span style={{ color: COLORS.text, fontSize: 32, fontWeight: 600 }}>
            Análisis completo — Infórmate Xatruch
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ImpactComparisonSlide({
  poor,
  middle,
  wealthy,
}: {
  poor: string;
  middle: string;
  wealthy: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame, fps, config: { damping: 15 } });

  const cards = [
    { label: "CLASE BAJA", icon: "👨‍👩‍👧", text: poor, color: COLORS.danger },
    { label: "CLASE MEDIA", icon: "👔", text: middle, color: COLORS.accent },
    { label: "CLASE ALTA", icon: "🏛️", text: wealthy, color: COLORS.success },
  ];

  return (
    <AbsoluteFill
      style={{ background: COLORS.bg, padding: "80px 120px", justifyContent: "center" }}
    >
      <div style={{ opacity }}>
        <h2
          style={{
            color: COLORS.text,
            fontSize: 52,
            fontWeight: 800,
            marginBottom: 48,
            borderLeft: `8px solid ${COLORS.accent}`,
            paddingLeft: 24,
          }}
        >
          💰 IMPACTO POR CLASE SOCIAL
        </h2>
        <div style={{ display: "flex", gap: 32 }}>
          {cards.map(({ label, icon, text, color }) => (
            <div
              key={label}
              style={{
                flex: 1,
                background: COLORS.card,
                border: `2px solid ${color}`,
                borderRadius: 20,
                padding: 32,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
              <div style={{ color, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
                {label}
              </div>
              <p style={{ color: COLORS.text, fontSize: 26, lineHeight: 1.6 }}>
                {text.slice(0, 300)}...
              </p>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function OutroSlide() {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${COLORS.primary}, #4f46e5)`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center", padding: "0 120px" }}>
        <h2 style={{ color: "white", fontSize: 80, fontWeight: 900, marginBottom: 32 }}>
          Infórmate Xatruch
        </h2>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 40, lineHeight: 1.5, marginBottom: 48 }}>
          Transparencia legislativa para el pueblo hondureño.
          Sin sesgos. Solo la verdad.
        </p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center" }}>
          <span style={{ background: "white", color: COLORS.primary, padding: "16px 32px", borderRadius: 50, fontSize: 30, fontWeight: 700 }}>
            👍 Suscríbete
          </span>
          <span style={{ background: "rgba(255,255,255,0.2)", color: "white", padding: "16px 32px", borderRadius: 50, fontSize: 30 }}>
            🔔 Activa notificaciones
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const YouTubeVideo: React.FC<YouTubeVideoProps> = (props) => {
  const { fps } = useVideoConfig();

  const INTRO = fps * 8;
  const SUMMARY = fps * 12;
  const CAUSES = fps * 15;
  const EFFECTS = fps * 15;
  const BENEFITS = fps * 12;
  const DRAWBACKS = fps * 12;
  const IMPACT = fps * 20;
  const CONSTITUTIONAL = fps * 15;
  const OUTRO = fps * 8;

  let offset = 0;
  const sections = [
    { component: null, duration: INTRO }, // intro handled separately
    { component: "summary", duration: SUMMARY },
    { component: "causes", duration: CAUSES },
    { component: "effects", duration: EFFECTS },
    { component: "benefits", duration: BENEFITS },
    { component: "drawbacks", duration: DRAWBACKS },
    { component: "impact", duration: IMPACT },
    { component: "constitutional", duration: CONSTITUTIONAL },
    { component: "outro", duration: OUTRO },
  ];

  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Sequence from={0} durationInFrames={INTRO}>
        <IntroSlide
          title={props.lawTitle}
          lawNumber={props.lawNumber}
          date={props.gazetteDate}
        />
      </Sequence>

      <Sequence from={INTRO} durationInFrames={SUMMARY}>
        <TextSection title="Resumen" icon="📋" content={props.summary} />
      </Sequence>

      <Sequence from={INTRO + SUMMARY} durationInFrames={CAUSES}>
        <TextSection title="¿Por qué se creó?" icon="🔍" content={props.causes} accentColor={COLORS.secondary} />
      </Sequence>

      <Sequence from={INTRO + SUMMARY + CAUSES} durationInFrames={EFFECTS}>
        <TextSection title="¿Qué cambia?" icon="⚡" content={props.effects} accentColor={COLORS.accent} />
      </Sequence>

      <Sequence from={INTRO + SUMMARY + CAUSES + EFFECTS} durationInFrames={BENEFITS}>
        <TextSection title="Lo bueno" icon="✅" content={props.benefits} accentColor={COLORS.success} />
      </Sequence>

      <Sequence from={INTRO + SUMMARY + CAUSES + EFFECTS + BENEFITS} durationInFrames={DRAWBACKS}>
        <TextSection title="Lo malo" icon="⚠️" content={props.drawbacks} accentColor={COLORS.danger} />
      </Sequence>

      <Sequence from={INTRO + SUMMARY + CAUSES + EFFECTS + BENEFITS + DRAWBACKS} durationInFrames={IMPACT}>
        <ImpactComparisonSlide
          poor={props.poorImpact}
          middle={props.middleImpact}
          wealthy={props.wealthyImpact}
        />
      </Sequence>

      <Sequence from={INTRO + SUMMARY + CAUSES + EFFECTS + BENEFITS + DRAWBACKS + IMPACT} durationInFrames={CONSTITUTIONAL}>
        <TextSection
          title={props.isConstitutional ? "Verificación Constitucional ✅" : "Alerta Constitucional ⚠️"}
          icon="⚖️"
          content={props.constitutionalFindings}
          accentColor={props.isConstitutional ? COLORS.success : COLORS.danger}
        />
      </Sequence>

      <Sequence from={INTRO + SUMMARY + CAUSES + EFFECTS + BENEFITS + DRAWBACKS + IMPACT + CONSTITUTIONAL} durationInFrames={OUTRO}>
        <OutroSlide />
      </Sequence>
    </AbsoluteFill>
  );
};
