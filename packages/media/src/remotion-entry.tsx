import React from "react";
import { Composition } from "remotion";
import { TikTokVideo, type TikTokVideoProps } from "./templates/TikTokVideo.js";
import { YouTubeVideo, type YouTubeVideoProps } from "./templates/YouTubeVideo.js";

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
    </>
  );
};
