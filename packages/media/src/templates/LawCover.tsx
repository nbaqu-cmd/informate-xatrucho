import React from "react";
import { AbsoluteFill } from "remotion";

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
  purple: "#6B4E9E",
};

const CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
  SEGURIDAD: { label: "Seguridad", color: COLORS.red },
  FINANZAS: { label: "Finanzas públicas", color: COLORS.green },
  ELECCIONES: { label: "Elecciones", color: COLORS.blue },
  SALUD: { label: "Salud", color: COLORS.green },
  INFRAESTRUCTURA: { label: "Infraestructura", color: COLORS.amber },
  EDUCACION: { label: "Educación", color: COLORS.blue },
  JUSTICIA: { label: "Justicia", color: COLORS.purple },
  GOBERNANZA: { label: "Gobernanza", color: COLORS.ink700 },
  DERECHOS: { label: "Derechos", color: COLORS.purple },
  OTRO: { label: "Decreto legislativo", color: COLORS.ink700 },
};

export interface LawCoverProps {
  lawNumber: string;
  topicLabel: string;
  category: string;
  gazetteDate: string;
  isConstitutional: boolean;
}

export const LawCover: React.FC<LawCoverProps> = ({
  lawNumber,
  topicLabel,
  category,
  gazetteDate,
  isConstitutional,
}) => {
  const cat = CATEGORY_STYLE[category] ?? CATEGORY_STYLE["OTRO"]!;
  const alert = !isConstitutional;

  return (
    <AbsoluteFill style={{ background: COLORS.paper, fontFamily: "Georgia, serif", overflow: "hidden" }}>
      {/* Honduras flag accent stripe down the left edge */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, background: COLORS.blue }} />
        <div style={{ flex: 1, background: COLORS.paper }} />
        <div style={{ flex: 1, background: COLORS.blue }} />
      </div>

      {/* Oversized faded decree number as a watermark on the right */}
      <div
        style={{
          position: "absolute",
          right: -40,
          bottom: -90,
          fontSize: 460,
          fontWeight: 800,
          color: "rgba(21,23,28,0.045)",
          lineHeight: 0.8,
          letterSpacing: -10,
          userSelect: "none",
        }}
      >
        {lawNumber.split("-")[0]}
      </div>

      <div style={{ position: "absolute", inset: 0, padding: "70px 80px 64px 96px", display: "flex", flexDirection: "column" }}>
        {/* Masthead */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", gap: 5 }}>
            <span style={{ width: 13, height: 13, background: COLORS.blue }} />
            <span style={{ width: 13, height: 13, background: COLORS.red }} />
            <span style={{ width: 13, height: 13, background: COLORS.blue }} />
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, color: COLORS.ink, letterSpacing: 0.5 }}>
            Infórmate <span style={{ fontStyle: "italic" }}>Xatrucho</span>
          </span>
          <span style={{ marginLeft: 14, fontSize: 19, color: COLORS.ink500, fontFamily: "Arial, sans-serif", letterSpacing: 3, textTransform: "uppercase" }}>
            Transparencia legislativa
          </span>
        </div>

        {/* Kicker + category chip */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 56 }}>
          <span style={{ background: COLORS.red, color: "#fff", fontFamily: "Arial, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "8px 16px" }}>
            Análisis legislativo
          </span>
          <span style={{ border: `2px solid ${cat.color}`, color: cat.color, fontFamily: "Arial, sans-serif", fontSize: 20, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 16px" }}>
            {cat.label}
          </span>
        </div>

        {/* Decree number — the hero, split so the number never wraps */}
        <div style={{ marginTop: 30, fontFamily: "Arial, sans-serif", fontSize: 34, fontWeight: 700, letterSpacing: 8, textTransform: "uppercase", color: COLORS.ink500 }}>
          Decreto N.º
        </div>
        <h1 style={{ fontSize: 150, fontWeight: 800, color: COLORS.ink, lineHeight: 0.95, margin: "4px 0 0", letterSpacing: -3, whiteSpace: "nowrap" }}>
          {lawNumber}
        </h1>

        {/* Topic line */}
        <p style={{ fontSize: 46, color: COLORS.ink700, lineHeight: 1.25, margin: "26px 0 0", maxWidth: 1000, fontStyle: "italic" }}>
          {topicLabel}
        </p>

        <div style={{ flex: 1 }} />

        {/* Constitutional alert or compliance line */}
        {alert ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16, background: COLORS.red, padding: "16px 24px", alignSelf: "flex-start", marginBottom: 22 }}>
            <span style={{ fontSize: 30 }}>⚠</span>
            <span style={{ color: "#fff", fontFamily: "Arial, sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Posible inconstitucionalidad
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, alignSelf: "flex-start", marginBottom: 22 }}>
            <span style={{ width: 12, height: 12, borderRadius: 6, background: COLORS.green }} />
            <span style={{ color: COLORS.green, fontFamily: "Arial, sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
              Revisado con la Constitución
            </span>
          </div>
        )}

        {/* Footer meta */}
        <div style={{ borderTop: `2px solid ${COLORS.border}`, paddingTop: 20, display: "flex", alignItems: "center", gap: 16, fontFamily: "Arial, sans-serif", fontSize: 22, color: COLORS.ink500 }}>
          <span>Congreso Nacional de Honduras</span>
          <span style={{ color: COLORS.border }}>•</span>
          <span>{gazetteDate}</span>
          <span style={{ color: COLORS.border }}>•</span>
          <span>Análisis generado por IA</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
