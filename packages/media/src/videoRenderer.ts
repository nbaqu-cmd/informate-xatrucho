import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import type { TikTokVideoProps } from "./templates/TikTokVideo.js";
import type { YouTubeVideoProps } from "./templates/YouTubeVideo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env["VIDEO_OUTPUT_DIR"] ?? "/tmp/informate-videos";

export async function renderTikTokVideo(
  props: TikTokVideoProps,
  outputName: string
): Promise<string> {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = join(OUTPUT_DIR, `${outputName}-tiktok.mp4`);

  const bundled = await bundle({
    entryPoint: join(__dirname, "remotion-entry.tsx"),
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundled,
    id: "TikTokVideo",
    inputProps: props,
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: props,
  });

  return outputPath;
}

export async function renderYouTubeVideo(
  props: YouTubeVideoProps,
  outputName: string
): Promise<string> {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = join(OUTPUT_DIR, `${outputName}-youtube.mp4`);

  const bundled = await bundle({
    entryPoint: join(__dirname, "remotion-entry.tsx"),
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundled,
    id: "YouTubeVideo",
    inputProps: props,
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: props,
  });

  return outputPath;
}
