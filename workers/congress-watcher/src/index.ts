import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { db } from "@informate/database";
import {
  fetchCongressmen,
  fetchRecentlyApprovedLaws,
  fetchVotingRecord,
} from "@informate/scraper";

const connection = new IORedis(process.env["REDIS_URL"] ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "congress-monitor",
  async () => {
    console.log("[congress-watcher] Syncing congressman data from congresonacional.hn...");

    // 1. Sync congressman roster
    const congressmenData = await fetchCongressmen();
    for (const record of congressmenData) {
      // Upsert party first
      const party = await db.party.upsert({
        where: { name: record.party },
        create: { name: record.party, abbreviation: record.party.slice(0, 8) },
        update: {},
      });

      // Upsert congressman
      const existing = await db.congressman.findFirst({ where: { name: record.name } });
      if (!existing) {
        await db.congressman.create({
          data: {
            name: record.name,
            partyId: party.id,
            district: record.district,
            photoUrl: record.photoUrl,
          },
        });
      }
    }

    // 2. Check for recently approved laws and their votes
    const sinceDate = new Date(Date.now() - 7 * 86_400_000);
    const recentLaws = await fetchRecentlyApprovedLaws(sinceDate);

    for (const congressLaw of recentLaws) {
      const dbLaw = await db.law.findUnique({ where: { lawNumber: congressLaw.lawNumber } });
      if (!dbLaw) continue;

      const votingRecords = await fetchVotingRecord(
        congressLaw.lawNumber,
        congressLaw.sourceUrl
      );

      for (const record of votingRecords) {
        const congressman = await db.congressman.findFirst({
          where: { name: record.congressmanName },
        });
        const party = await db.party.findFirst({
          where: { name: record.party },
        });

        if (!congressman || !party) continue;

        await db.vote.upsert({
          where: { lawId_congressmanId: { lawId: dbLaw.id, congressmanId: congressman.id } },
          create: {
            lawId: dbLaw.id,
            congressmanId: congressman.id,
            partyId: party.id,
            vote: record.vote,
          },
          update: { vote: record.vote },
        });
      }
    }

    console.log("[congress-watcher] Sync complete");
  },
  { connection }
);

worker.on("failed", (job, err) => {
  console.error(`[congress-watcher] Job ${job?.id} failed:`, err);
});

console.log("[congress-watcher] Worker started...");
