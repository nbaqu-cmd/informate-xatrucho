import "dotenv/config";
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { db } from "@informate/database";
import { fetchCongressDecreesSince } from "@informate/scraper";

const connection = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const lawPipelineQueue = new Queue("law-pipeline", { connection });

const worker = new Worker(
  "gazette-monitor",
  async (job) => {
    console.log("[gazette-watcher] Checking Diario La Gaceta for new issues...");

    // Find the most recent gazette we already processed
    const mostRecent = await db.law.findFirst({
      orderBy: { gazetteDate: "desc" },
      select: { gazetteDate: true },
    });

    const sinceDate = mostRecent?.gazetteDate
      ? new Date(mostRecent.gazetteDate.getTime() - 86_400_000) // 1 day buffer
      : new Date(Date.now() - 7 * 86_400_000); // default: last 7 days

    const decrees = await fetchCongressDecreesSince(sinceDate);
    console.log(`[gazette-watcher] Found ${decrees.length} decree(s) since ${sinceDate.toISOString().slice(0, 10)}`);

    for (const decree of decrees) {
      // Skip if already processed
      const existing = await db.law.findUnique({ where: { lawNumber: decree.lawNumber } });
      if (existing) continue;

      const created = await db.law.create({
        data: {
          lawNumber: decree.lawNumber,
          title: decree.title,
          gazetteNumber: decree.gazetteNumber,
          gazetteDate: decree.gazetteDate,
          fullText: decree.fullText,
          sourceUrl: decree.sourceUrl,
        },
      });

      await lawPipelineQueue.add("law-pipeline", { lawId: created.id });
      console.log(`[gazette-watcher] Queued pipeline for law: ${decree.lawNumber} — ${decree.title}`);
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`[gazette-watcher] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[gazette-watcher] Job ${job?.id} failed:`, err);
});

console.log("[gazette-watcher] Worker started, listening for gazette-monitor jobs...");
