import { writeFile } from "fs/promises";
import mp3Duration from "mp3-duration";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Microsoft Edge's online neural TTS — free, no API key, no quota, and it
// offers genuine Honduran Spanish neural voices (es-HN-CarlosNeural /
// es-HN-KarlaNeural), which fits this audience far better than a generic
// robotic free voice. This is the default provider; if a paid key is ever
// configured (ElevenLabs / OpenAI) we prefer it, but Edge keeps the feature
// fully working out of the box at zero cost.
const DEFAULT_EDGE_VOICE = "es-HN-CarlosNeural";

const ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech";

export interface SynthesizedSpeech {
  /** Absolute path to the written mp3 file. */
  path: string;
  /** Duration of the audio in seconds. */
  durationSeconds: number;
}

/** Returns which provider will be used, for logging/diagnostics. */
export function activeTtsProvider(): "elevenlabs" | "openai" | "edge" {
  if (process.env["ELEVENLABS_API_KEY"] && process.env["ELEVENLABS_VOICE_ID"]) return "elevenlabs";
  if (process.env["OPENAI_TTS_ENABLED"] === "1" && process.env["OPENAI_API_KEY"]) return "openai";
  return "edge";
}

/**
 * Synthesizes one narration segment to an mp3 file and measures its real
 * duration (so the video timeline can follow the actual spoken length).
 * Picks the best available provider: a configured paid voice if present,
 * otherwise the free Honduran Edge neural voice.
 */
export async function synthesizeSpeech(text: string, outPath: string): Promise<SynthesizedSpeech> {
  const provider = activeTtsProvider();
  let buffer: Buffer;

  if (provider === "elevenlabs") {
    buffer = await synthesizeElevenLabs(text);
  } else if (provider === "openai") {
    buffer = await synthesizeOpenAI(text);
  } else {
    buffer = await synthesizeEdge(text);
  }

  await writeFile(outPath, buffer);

  const durationSeconds = await new Promise<number>((resolve) => {
    mp3Duration(buffer, (err: Error | null, duration: number) => {
      resolve(err || !duration ? estimateDuration(text) : duration);
    });
  });

  return { path: outPath, durationSeconds };
}

async function synthesizeEdge(text: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    process.env["EDGE_TTS_VOICE"] ?? DEFAULT_EDGE_VOICE,
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
  );
  const { audioStream } = await tts.toStream(text);

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    audioStream.on("data", (c: Buffer) => chunks.push(c));
    audioStream.on("end", () => resolve(Buffer.concat(chunks)));
    audioStream.on("error", reject);
    setTimeout(() => reject(new Error("Edge TTS timed out")), 30_000);
  });
}

async function synthesizeElevenLabs(text: string): Promise<Buffer> {
  const apiKey = process.env["ELEVENLABS_API_KEY"]!;
  const voiceId = process.env["ELEVENLABS_VOICE_ID"]!;
  const res = await fetch(`${ELEVENLABS_TTS_URL}/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`ElevenLabs TTS failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function synthesizeOpenAI(text: string): Promise<Buffer> {
  const apiKey = process.env["OPENAI_API_KEY"]!;
  const res = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env["OPENAI_TTS_MODEL"] ?? "gpt-4o-mini-tts",
      voice: process.env["OPENAI_TTS_VOICE"] ?? "onyx",
      input: text,
      response_format: "mp3",
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI TTS failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/** Fallback if metadata lacks a duration: ~15 spoken chars/sec for Spanish. */
function estimateDuration(text: string): number {
  return Math.max(2, text.length / 15);
}
