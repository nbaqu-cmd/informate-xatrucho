import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { join } from "path";
import { mkdirSync } from "fs";
import { db } from "@informate/database";
import {
  searchYouTubeVideos,
  downloadYouTubeVideo,
  extractFrames,
  scanFramesForCongressmen,
  extractClip,
  uploadFile,
} from "@informate/media";

const connection = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const FRAME_INTERVAL_SECONDS = 10;
const CLIP_DURATION_SECONDS = 45;
const WORK_DIR = process.env["DOWNLOADS_DIR"] ?? "/tmp/informate-downloads";

const worker = new Worker(
  "face-recognize",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    const law = await db.law.findUniqueOrThrow({ where: { id: lawId } });

    // Search news sites for interview videos
    const queries = [
      `Honduras entrevista congresista decreto ${law.lawNumber}`,
      `Honduras diputado ley ${law.title.slice(0, 50)}`,
    ];

    for (const query of queries) {
      let videoUrls: string[] = [];
      try {
        videoUrls = await searchYouTubeVideos(query, 3);
      } catch {
        continue;
      }

      for (const url of videoUrls) {
        try {
          const downloaded = await downloadYouTubeVideo(url, `fr-${lawId}-${Date.now()}`);
          const framesDir = join(WORK_DIR, `frames-${lawId}-${Date.now()}`);
          mkdirSync(framesDir, { recursive: true });

          const framePaths = await extractFrames(
            downloaded.localPath,
            framesDir,
            FRAME_INTERVAL_SECONDS
          );

          const matches = await scanFramesForCongressmen(framePaths, FRAME_INTERVAL_SECONDS);

          for (const match of matches) {
            // Extract a clip around the appearance
            const clipPath = join(WORK_DIR, `clip-${match.congressmanId}-${match.timestamp}.mp4`);
            const clipStart = Math.max(0, match.timestamp - 10);
            await extractClip(downloaded.localPath, clipStart, CLIP_DURATION_SECONDS, clipPath);

            // Upload clip to S3
            const clipS3Url = await uploadFile(
              clipPath,
              `clips/${lawId}/${match.congressmanId}-${match.timestamp}.mp4`
            );

            await db.congressmanAppearance.create({
              data: {
                lawId,
                congressmanId: match.congressmanId,
                videoUrl: url,
                clipUrl: clipS3Url,
                timestamp: match.timestamp,
                confidence: match.confidence,
              },
            });

            console.log(
              `[face-recognition] Found congressman ${match.congressmanId} at ${match.timestamp}s in ${url}`
            );
          }
        } catch (err) {
          console.error(`[face-recognition] Failed to process ${url}:`, err);
        }
      }
    }

    console.log(`[face-recognition] Done for lawId ${lawId}`);
  },
  { connection, concurrency: 1 }
);

worker.on("failed", (job, err) => {
  console.error(`[face-recognition] Job ${job?.id} failed:`, err);
});

console.log("[face-recognition] Worker started...");
