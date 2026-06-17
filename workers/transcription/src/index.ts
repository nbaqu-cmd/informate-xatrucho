import "dotenv/config";
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { join } from "path";
import { db } from "@informate/database";
import {
  searchYouTubeVideos,
  downloadYouTubeVideo,
  extractAudioFromVideo,
  transcribeAudio,
} from "@informate/media";

const connection = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const generateVideoQueue = new Queue("generate-video", { connection });

const CANAL20_CHANNEL = "Canal 20 Honduras";
const CONGRESS_CHANNEL = "Congreso Nacional Honduras";

const worker = new Worker(
  "transcribe",
  async (job) => {
    const { lawId } = job.data as { lawId: string };
    const law = await db.law.findUniqueOrThrow({ where: { id: lawId } });

    await db.law.update({ where: { id: lawId }, data: { status: "TRANSCRIBING" } });

    const queries = [
      `${CANAL20_CHANNEL} ${law.title}`,
      `${CONGRESS_CHANNEL} Decreto ${law.lawNumber}`,
      `Honduras ley ${law.lawNumber} ${new Date(law.gazetteDate).getFullYear()}`,
    ];

    for (const query of queries) {
      let videoUrls: string[] = [];
      try {
        videoUrls = await searchYouTubeVideos(query, 2);
      } catch (err) {
        console.error(`[transcription] Search failed for query: ${query}`, err);
        continue;
      }

      for (const url of videoUrls) {
        try {
          // Download video
          const downloaded = await downloadYouTubeVideo(
            url,
            `${lawId}-${Date.now()}`
          );

          // Extract audio
          const audioPath = downloaded.localPath.replace(".mp4", ".mp3");
          await extractAudioFromVideo(downloaded.localPath, audioPath);

          // Transcribe
          const transcription = await transcribeAudio(audioPath);

          // Save to DB
          await db.transcript.create({
            data: {
              lawId,
              type: url.includes("sesion") || url.includes("congress") ? "SESSION" : "INTERVIEW",
              videoUrl: url,
              content: transcription.text,
              language: transcription.language,
            },
          });

          console.log(`[transcription] Saved transcript for ${url} (${transcription.duration}s)`);
        } catch (err) {
          console.error(`[transcription] Failed to process ${url}:`, err);
        }
      }
    }

    // Notify pipeline orchestrator that transcription is done
    // The orchestrator checks if all 4 AI analyses + this are done before generating video
    console.log(`[transcription] Done for lawId ${lawId}`);
  },
  { connection, concurrency: 2 }
);

worker.on("failed", (job, err) => {
  console.error(`[transcription] Job ${job?.id} failed:`, err);
});

console.log("[transcription] Worker started...");
