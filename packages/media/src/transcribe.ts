import OpenAI from "openai";
import { createReadStream } from "fs";

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
}

// Lazily instantiated so merely importing this module (e.g. via the package
// barrel) doesn't require OPENAI_API_KEY — only calling transcribeAudio does.
let openaiClient: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: process.env["OPENAI_API_KEY"] });
  return openaiClient;
}

export async function transcribeAudio(
  audioFilePath: string
): Promise<TranscriptionResult> {
  const fileStream = createReadStream(audioFilePath);

  const transcription = await getOpenAI().audio.transcriptions.create({
    file: fileStream,
    model: "whisper-1",
    language: "es",
    response_format: "verbose_json",
  });

  return {
    text: transcription.text,
    language: transcription.language ?? "es",
    duration: transcription.duration ?? 0,
  };
}

export async function extractAudioFromVideo(
  videoPath: string,
  outputAudioPath: string
): Promise<void> {
  const { promisify } = await import("util");
  const { exec } = await import("child_process");
  const execAsync = promisify(exec);

  // Extract audio as mp3 using FFmpeg
  await execAsync(
    `ffmpeg -i "${videoPath}" -q:a 0 -map a "${outputAudioPath}" -y`
  );
}
