import React from "react";
import { Composition, registerRoot } from "remotion";
import { TikTokVideo, type TikTokVideoProps } from "./templates/TikTokVideo";
import { YouTubeVideo, type YouTubeVideoProps } from "./templates/YouTubeVideo";
import { WebExplainer, type WebExplainerProps } from "./templates/WebExplainer";
import { LawCover, type LawCoverProps } from "./templates/LawCover";

const EXPLAINER_FPS = 30;

const defaultCoverProps: LawCoverProps = {
  lawNumber: "001-2026",
  topicLabel: "Tema de ejemplo de la ley",
  category: "OTRO",
  gazetteDate: "17 de junio de 2026",
  isConstitutional: true,
};

const TIKTOK_FPS = 30;
const YOUTUBE_FPS = 30;

// Approx total: 4 + (5*5) + 8 + 4 + 4 = 45 seconds @ 30fps = 1350 frames
const TIKTOK_TOTAL_FRAMES = 1350;

// Approx total: 8+12+15+15+12+12+20+15+8 = 117 seconds @ 30fps = 3510 frames
const YOUTUBE_TOTAL_FRAMES = 3510;

const defaultTikTokProps: TikTokVideoProps = {
  lawTitle: "Decreto de Ejemplo",
  lawNumber: "001-2026",
  keyPoints: ["Punto 1", "Punto 2", "Punto 3", "Punto 4", "Punto 5"],
  poorImpact: "Impacto en clase baja",
  middleImpact: "Impacto en clase media",
  wealthyImpact: "Impacto en clase alta",
  isConstitutional: true,
  gazetteDate: "16/06/2026",
};

const defaultExplainerProps: WebExplainerProps = {
  lawTitle: "Decreto de Ejemplo",
  lawNumber: "001-2026",
  gazetteDate: "17 de junio de 2026",
  isConstitutional: true,
  intro: { onScreen: "Resumen de ejemplo.", audioFile: "", durationInFrames: 90 },
  sections: [
    { heading: "¿Qué es?", onScreen: "Ejemplo", tone: "neutral", audioFile: "", durationInFrames: 90 },
  ],
  outro: { onScreen: "Cierre de ejemplo.", audioFile: "", durationInFrames: 90 },
  totalFrames: 270,
};

const defaultYouTubeProps: YouTubeVideoProps = {
  lawTitle: "Decreto de Ejemplo",
  lawNumber: "001-2026",
  gazetteDate: "16/06/2026",
  summary: "Resumen de la ley",
  keyPoints: [],
  causes: "Causas de la ley",
  effects: "Efectos de la ley",
  benefits: "Beneficios",
  drawbacks: "Desventajas",
  poorImpact: "Impacto clase baja",
  middleImpact: "Impacto clase media",
  wealthyImpact: "Impacto clase alta",
  constitutionalFindings: "Hallazgos constitucionales",
  isConstitutional: true,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TikTokVideo"
        component={TikTokVideo}
        durationInFrames={TIKTOK_TOTAL_FRAMES}
        fps={TIKTOK_FPS}
        width={1080}
        height={1920}
        defaultProps={defaultTikTokProps}
      />
      <Composition
        id="YouTubeVideo"
        component={YouTubeVideo}
        durationInFrames={YOUTUBE_TOTAL_FRAMES}
        fps={YOUTUBE_FPS}
        width={1920}
        height={1080}
        defaultProps={defaultYouTubeProps}
      />
      <Composition
        id="WebExplainer"
        component={WebExplainer}
        durationInFrames={defaultExplainerProps.totalFrames}
        fps={EXPLAINER_FPS}
        width={1920}
        height={1080}
        defaultProps={defaultExplainerProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: props.totalFrames,
          fps: EXPLAINER_FPS,
          width: 1920,
          height: 1080,
        })}
      />
      <Composition
        id="LawCover"
        component={LawCover}
        durationInFrames={1}
        fps={1}
        width={1200}
        height={675}
        defaultProps={defaultCoverProps}
      />
    </>
  );
};

registerRoot(RemotionRoot);
