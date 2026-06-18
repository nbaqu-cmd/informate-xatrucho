import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdtempSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { synthesizeSpeech, activeTtsProvider } from "./tts.js";
import type { WebExplainerProps, ExplainerSegment } from "./templates/WebExplainer.js";

/** A verified illustrative image to weave into the video. */
export interface ExplainerImage {
  buffer: Buffer;
  ext: string;
  credit: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env["VIDEO_OUTPUT_DIR"] ?? join(tmpdir(), "informate-videos");
const FPS = 30;
// Hold each card a beat past its narration so the last words aren't cut off and
// the viewer can finish reading the on-screen text.
const TAIL_PADDING_SECONDS = 0.9;

export interface ExplainerScriptInput {
  lawTitle: string;
  lawNumber: string;
  gazetteDate: string;
  isConstitutional: boolean;
  intro: string;
  sections: Array<{ heading: string; narration: string; onScreen: string; tone: "neutral" | "alert" }>;
  outro: string;
}

export interface RenderedExplainer {
  path: string;
  durationSeconds: number;
  provider: string;
}

function framesFor(durationSeconds: number): number {
  return Math.round((durationSeconds + TAIL_PADDING_SECONDS) * FPS);
}

/**
 * Produces the narrated website explainer video for a law: synthesizes each
 * script segment to speech, sizes each on-screen card to its real spoken
 * length, and renders the Remotion composition with the audio muxed in.
 * The audio mp3s are written into a temp dir that becomes the Remotion
 * bundle's publicDir, so staticFile(name) resolves to them at render time.
 */
export async function renderExplainerVideo(
  script: ExplainerScriptInput,
  images: ExplainerImage[],
  outputName: string
): Promise<RenderedExplainer> {
  const provider = activeTtsProvider();
  const audioDir = mkdtempSync(join(tmpdir(), "informate-audio-"));

  // Write verified images into the publicDir so staticFile() resolves them.
  const imageFiles = images.map((img, i) => {
    const file = `img-${i}.${img.ext}`;
    writeFileSync(join(audioDir, file), img.buffer);
    return { file, credit: img.credit };
  });
  // The intro and each neutral section take the next image in turn; the
  // constitutional ALERT section keeps its strong red text card (no photo),
  // and once images run out the remaining sections fall back to text cards.
  let imgCursor = 0;
  const nextImage = () => (imgCursor < imageFiles.length ? imageFiles[imgCursor++] : undefined);
  const introImage = nextImage();

  // Synthesize intro, each section, and outro to mp3 + measure real durations.
  const intro = await synthesizeSegment(script.intro, "intro", audioDir);

  const sections: ExplainerSegment[] = [];
  for (let i = 0; i < script.sections.length; i++) {
    const s = script.sections[i]!;
    const audio = await synthesizeSegment(s.narration, `section-${i}`, audioDir);
    const img = s.tone === "alert" ? undefined : nextImage();
    sections.push({
      heading: s.heading,
      onScreen: s.onScreen,
      tone: s.tone,
      audioFile: audio.file,
      durationInFrames: framesFor(audio.durationSeconds),
      imageFile: img?.file,
      imageCredit: img?.credit,
    });
  }

  const outro = await synthesizeSegment(script.outro, "outro", audioDir);

  const totalFrames =
    framesFor(intro.durationSeconds) +
    sections.reduce((sum, s) => sum + s.durationInFrames, 0) +
    framesFor(outro.durationSeconds);

  const props: WebExplainerProps = {
    lawTitle: script.lawTitle,
    lawNumber: script.lawNumber,
    gazetteDate: script.gazetteDate,
    isConstitutional: script.isConstitutional,
    intro: {
      onScreen: script.intro,
      audioFile: intro.file,
      durationInFrames: framesFor(intro.durationSeconds),
      imageFile: introImage?.file,
      imageCredit: introImage?.credit,
    },
    sections,
    outro: { onScreen: script.outro, audioFile: outro.file, durationInFrames: framesFor(outro.durationSeconds) },
    totalFrames,
  };

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = join(OUTPUT_DIR, `${outputName}-explainer.mp4`);

  const bundled = await bundle({
    entryPoint: join(__dirname, "remotion-entry.tsx"),
    publicDir: audioDir,
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundled,
    id: "WebExplainer",
    inputProps: props,
  });

  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: props,
  });

  return { path: outputPath, durationSeconds: totalFrames / FPS, provider };
}

async function synthesizeSegment(
  text: string,
  name: string,
  audioDir: string
): Promise<{ file: string; durationSeconds: number }> {
  const file = `${name}.mp3`;
  const { durationSeconds } = await synthesizeSpeech(text, join(audioDir, file));
  return { file, durationSeconds };
}
