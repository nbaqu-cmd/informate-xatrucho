import { createWriteStream, mkdirSync } from "fs";
import { join } from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export interface DownloadResult {
  localPath: string;
  duration: number; // seconds
  title: string;
}

const DOWNLOADS_DIR = process.env["DOWNLOADS_DIR"] ?? "/tmp/informate-downloads";

export function ensureDownloadsDir(): void {
  mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

export async function downloadYouTubeVideo(
  youtubeUrl: string,
  outputName: string
): Promise<DownloadResult> {
  ensureDownloadsDir();
  const outputPath = join(DOWNLOADS_DIR, `${outputName}.mp4`);

  // yt-dlp must be installed on the system
  const { stdout } = await execAsync(
    `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" ` +
    `--get-title --print-json -o "${outputPath}" "${youtubeUrl}"`
  );

  let title = outputName;
  let duration = 0;

  try {
    const info = JSON.parse(stdout.split("\n").find((l) => l.startsWith("{")) ?? "{}") as {
      title?: string;
      duration?: number;
    };
    title = info.title ?? outputName;
    duration = info.duration ?? 0;
  } catch {
    // yt-dlp may not return JSON on all versions
  }

  return { localPath: outputPath, duration, title };
}

export async function searchYouTubeVideos(
  query: string,
  maxResults = 5
): Promise<string[]> {
  // Use yt-dlp to search YouTube
  const { stdout } = await execAsync(
    `yt-dlp "ytsearch${maxResults}:${query}" --get-id --no-playlist`
  );

  return stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((id) => `https://www.youtube.com/watch?v=${id}`);
}
