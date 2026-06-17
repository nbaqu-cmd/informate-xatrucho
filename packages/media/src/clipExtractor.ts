import { promisify } from "util";
import { exec } from "child_process";
import { join, dirname } from "path";
import { mkdirSync } from "fs";

const execAsync = promisify(exec);

export interface ClipResult {
  localPath: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export async function extractClip(
  videoPath: string,
  startTimeSeconds: number,
  durationSeconds: number,
  outputPath: string
): Promise<ClipResult> {
  mkdirSync(dirname(outputPath), { recursive: true });

  await execAsync(
    `ffmpeg -ss ${startTimeSeconds} -i "${videoPath}" -t ${durationSeconds} ` +
    `-c:v libx264 -c:a aac -preset fast "${outputPath}" -y`
  );

  return {
    localPath: outputPath,
    startTime: startTimeSeconds,
    endTime: startTimeSeconds + durationSeconds,
    duration: durationSeconds,
  };
}

export async function extractFrames(
  videoPath: string,
  outputDir: string,
  fpsEvery = 30
): Promise<string[]> {
  mkdirSync(outputDir, { recursive: true });
  const pattern = join(outputDir, "frame_%04d.jpg");

  // Extract 1 frame every N seconds
  await execAsync(
    `ffmpeg -i "${videoPath}" -vf "fps=1/${fpsEvery}" "${pattern}" -y`
  );

  const { readdir } = await import("fs/promises");
  const files = await readdir(outputDir);
  return files
    .filter((f) => f.endsWith(".jpg"))
    .map((f) => join(outputDir, f))
    .sort();
}
