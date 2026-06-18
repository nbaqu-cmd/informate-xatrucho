import "dotenv/config";
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { createReadStream } from "fs";
import { db } from "@informate/database";
import { google } from "googleapis";
import fetch from "node-fetch";

const connection = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const compileReportQueue = new Queue("compile-report", { connection });

// ─── YouTube OAuth2 ───────────────────────────────────────────────────────────

const oauth2Client = new google.auth.OAuth2(
  process.env["YOUTUBE_CLIENT_ID"],
  process.env["YOUTUBE_CLIENT_SECRET"]
);
oauth2Client.setCredentials({ refresh_token: process.env["YOUTUBE_REFRESH_TOKEN"] });
const youtube = google.youtube({ version: "v3", auth: oauth2Client });

async function publishToYouTube(
  videoPath: string,
  title: string,
  description: string
): Promise<string | undefined> {
  const response = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: title.slice(0, 100),
        description,
        tags: ["Honduras", "leyes", "transparencia", "congreso", "InformateXatruch"],
        categoryId: "25", // News & Politics
        defaultLanguage: "es",
      },
      status: { privacyStatus: "public" },
    },
    media: {
      body: createReadStream(videoPath),
    },
  });
  return response.data.id ?? undefined;
}

// ─── TikTok Content API ────────────────────────────────────────────────────────

async function publishToTikTok(
  videoUrl: string,
  caption: string
): Promise<string | undefined> {
  // TikTok Content Posting API v2
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["TIKTOK_ACCESS_TOKEN"]}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: caption.slice(0, 150),
        privacy_level: "PUBLIC_TO_EVERYONE",
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info: {
        source: "PULL_FROM_URL",
        video_url: videoUrl,
      },
    }),
  });

  const data = await response.json() as { data?: { publish_id?: string } };
  return data?.data?.publish_id;
}

// ─── Instagram Graph API ───────────────────────────────────────────────────────

async function publishToInstagram(
  videoUrl: string,
  caption: string
): Promise<string | undefined> {
  const accountId = process.env["INSTAGRAM_ACCOUNT_ID"];
  const accessToken = process.env["INSTAGRAM_ACCESS_TOKEN"];

  // Step 1: Create media container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/media`,
    {
      method: "POST",
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: videoUrl,
        caption,
        access_token: accessToken ?? "",
      }),
    }
  );
  const container = await containerRes.json() as { id?: string };
  if (!container.id) return undefined;

  // Step 2: Publish
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${accountId}/media_publish`,
    {
      method: "POST",
      body: new URLSearchParams({
        creation_id: container.id,
        access_token: accessToken ?? "",
      }),
    }
  );
  const published = await publishRes.json() as { id?: string };
  return published.id;
}

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker(
  "publish",
  async (job) => {
    const { lawId } = job.data as { lawId: string };

    await db.law.update({ where: { id: lawId }, data: { status: "PUBLISHING" } });

    const law = await db.law.findUniqueOrThrow({
      where: { id: lawId },
      include: {
        videos: true,
        summary: { select: { plainSpanish: true, keyPoints: true } },
      },
    });

    const tikTokVideo = law.videos.find((v) => v.type === "TIKTOK_REELS");
    const youtubeVideo = law.videos.find((v) => v.type === "YOUTUBE");

    const keyPoints = (law.summary?.keyPoints as string[]) ?? [];
    const caption =
      `🇭🇳 ${law.title}\n\n` +
      keyPoints
        .slice(0, 3)
        .map((p) => `• ${p}`)
        .join("\n") +
      `\n\n#Honduras #Leyes #Transparencia #InformateXatruch #Congreso`;

    // Publish TikTok (uses S3 URL for pull-from-url)
    if (tikTokVideo) {
      try {
        const tiktokPostId = await publishToTikTok(tikTokVideo.url, caption);
        await db.socialPost.create({
          data: {
            lawId,
            platform: "TIKTOK",
            postId: tiktokPostId,
            status: tiktokPostId ? "PUBLISHED" : "FAILED",
            publishedAt: tiktokPostId ? new Date() : undefined,
          },
        });
        console.log(`[publisher] TikTok published: ${tiktokPostId}`);
      } catch (err) {
        console.error("[publisher] TikTok failed:", err);
        await db.socialPost.create({
          data: { lawId, platform: "TIKTOK", status: "FAILED" },
        });
      }

      // Instagram Reels (same 9:16 video)
      try {
        const igPostId = await publishToInstagram(tikTokVideo.url, caption);
        await db.socialPost.create({
          data: {
            lawId,
            platform: "INSTAGRAM",
            postId: igPostId,
            status: igPostId ? "PUBLISHED" : "FAILED",
            publishedAt: igPostId ? new Date() : undefined,
          },
        });
        console.log(`[publisher] Instagram published: ${igPostId}`);
      } catch (err) {
        console.error("[publisher] Instagram failed:", err);
        await db.socialPost.create({
          data: { lawId, platform: "INSTAGRAM", status: "FAILED" },
        });
      }
    }

    // Publish YouTube (16:9) — needs local file path, video stored on S3
    // In production: download from S3 first or keep local file
    if (youtubeVideo) {
      try {
        const ytVideoId = await publishToYouTube(
          youtubeVideo.url, // Note: in production, use local temp path
          `${law.title} — Análisis Completo | Infórmate Xatruch`,
          `Análisis completo del Decreto ${law.lawNumber}.\n\n${law.summary?.plainSpanish ?? ""}\n\n🇭🇳 Transparencia legislativa para Honduras.\n\n#Honduras #Congreso #Transparencia`
        );
        const ytUrl = ytVideoId ? `https://youtube.com/watch?v=${ytVideoId}` : undefined;
        await db.socialPost.create({
          data: {
            lawId,
            platform: "YOUTUBE",
            postId: ytVideoId,
            url: ytUrl,
            status: ytVideoId ? "PUBLISHED" : "FAILED",
            publishedAt: ytVideoId ? new Date() : undefined,
          },
        });
        console.log(`[publisher] YouTube published: ${ytVideoId}`);
      } catch (err) {
        console.error("[publisher] YouTube failed:", err);
        await db.socialPost.create({
          data: { lawId, platform: "YOUTUBE", status: "FAILED" },
        });
      }
    }

    // Queue report compilation
    await compileReportQueue.add("compile-report", { lawId });
    console.log(`[publisher] Publishing done for ${lawId}, queued report compilation`);
  },
  { connection, concurrency: 1 }
);

worker.on("failed", (job, err) => {
  console.error(`[publisher] Job ${job?.id} failed:`, err);
});

console.log("[publisher] Worker started...");
