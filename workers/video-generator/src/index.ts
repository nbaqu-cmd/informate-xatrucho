import "dotenv/config";
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { db } from "@informate/database";
import {
  renderTikTokVideo,
  renderYouTubeVideo,
  uploadFile,
} from "@informate/media";
import type { TikTokVideoProps } from "@informate/media";

const connection = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const publishQueue = new Queue("publish", { connection });

const worker = new Worker(
  "generate-video",
  async (job) => {
    const { lawId } = job.data as { lawId: string };

    await db.law.update({ where: { id: lawId }, data: { status: "VIDEO_GENERATING" } });

    const law = await db.law.findUniqueOrThrow({
      where: { id: lawId },
      include: {
        summary: true,
        analysis: true,
        impactAnalysis: true,
        constitutionalReview: true,
      },
    });

    if (!law.summary || !law.analysis || !law.impactAnalysis || !law.constitutionalReview) {
      throw new Error(`Law ${lawId} is missing required analysis before video generation`);
    }

    const keyPoints = law.summary.keyPoints as string[];
    const gazetteDate = new Date(law.gazetteDate).toLocaleDateString("es-HN");

    // Render TikTok/Reels video (9:16)
    console.log(`[video-generator] Rendering TikTok video for ${lawId}...`);
    const tikTokProps = {
      lawTitle: law.title,
      lawNumber: law.lawNumber,
      keyPoints,
      poorImpact: law.impactAnalysis.poorImpact,
      middleImpact: law.impactAnalysis.middleImpact,
      wealthyImpact: law.impactAnalysis.wealthyImpact,
      isConstitutional: law.constitutionalReview.isCompliant,
      gazetteDate,
    };

    const tikTokLocalPath = await renderTikTokVideo(tikTokProps, lawId);
    const tikTokUrl = await uploadFile(tikTokLocalPath, `videos/${lawId}/tiktok.mp4`);

    await db.generatedVideo.create({
      data: {
        lawId,
        type: "TIKTOK_REELS",
        url: tikTokUrl,
        duration: 45,
      },
    });

    // Render YouTube video (16:9)
    console.log(`[video-generator] Rendering YouTube video for ${lawId}...`);
    const youtubeProps = {
      lawTitle: law.title,
      lawNumber: law.lawNumber,
      gazetteDate,
      summary: law.summary.plainSpanish,
      keyPoints,
      causes: law.analysis.causes,
      effects: law.analysis.effects,
      benefits: law.analysis.benefits,
      drawbacks: law.analysis.drawbacks,
      poorImpact: law.impactAnalysis.poorImpact,
      middleImpact: law.impactAnalysis.middleImpact,
      wealthyImpact: law.impactAnalysis.wealthyImpact,
      constitutionalFindings: law.constitutionalReview.findings,
      isConstitutional: law.constitutionalReview.isCompliant,
    };

    const youtubeLocalPath = await renderYouTubeVideo(youtubeProps, lawId);
    const youtubeUrl = await uploadFile(youtubeLocalPath, `videos/${lawId}/youtube.mp4`);

    await db.generatedVideo.create({
      data: {
        lawId,
        type: "YOUTUBE",
        url: youtubeUrl,
        duration: 117,
      },
    });

    console.log(`[video-generator] Videos ready for ${lawId}, queuing publish...`);
    await publishQueue.add("publish", { lawId });
  },
  { connection, concurrency: 1 }
);

worker.on("failed", (job, err) => {
  console.error(`[video-generator] Job ${job?.id} failed:`, err);
});

console.log("[video-generator] Worker started...");
