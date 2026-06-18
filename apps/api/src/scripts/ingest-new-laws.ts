import "../env.js";
import { db } from "@informate/database";
import { fetchCongressDecreesSince } from "@informate/scraper";
import {
  runSummarize,
  runDeepAnalyze,
  runImpactAnalyze,
  runConstitutionalReview,
  runGenerateCover,
  runGenerateExplainer,
} from "../services/pipeline.js";
import { compileLawReport } from "../services/report.js";
import { runPatternDetection } from "../services/patterns.js";

const TERM_START = new Date(2026, 0, 1); // fallback if the DB is empty
const LOOKBACK_DAYS = 3; // re-scan a few days back to catch late-published issues

/**
 * Idempotent ingestion of NEW Congress decrees. Finds the most recent gazette
 * already in the database, scans La Gaceta from a few days before that to now,
 * and runs the full pipeline (analysis -> cover -> report -> narrated video ->
 * pattern detection) for any decree not already stored. Safe to run on a timer:
 * decrees that already exist are skipped. This is the single command to
 * schedule for automation.
 */
async function main() {
  const latest = await db.law.findFirst({ orderBy: { gazetteDate: "desc" }, select: { gazetteDate: true } });
  const since = latest?.gazetteDate
    ? new Date(latest.gazetteDate.getTime() - LOOKBACK_DAYS * 86_400_000)
    : TERM_START;

  console.log(`[ingest] ${new Date().toISOString()} — scanning La Gaceta since ${since.toISOString().slice(0, 10)}...`);
  const decrees = await fetchCongressDecreesSince(since);
  console.log(`[ingest] Found ${decrees.length} candidate decree(s) in range.`);

  let added = 0;
  for (const decree of decrees) {
    const existing = await db.law.findUnique({ where: { lawNumber: decree.lawNumber } });
    if (existing) continue;

    console.log(`\n[ingest] NEW Decreto ${decree.lawNumber} — ${decree.title}`);
    try {
      const law = await db.law.create({
        data: {
          lawNumber: decree.lawNumber,
          title: decree.title,
          gazetteNumber: decree.gazetteNumber,
          gazetteDate: decree.gazetteDate,
          fullText: decree.fullText,
          sourceUrl: decree.sourceUrl,
        },
      });

      await runSummarize(law.id);
      await runDeepAnalyze(law.id);
      await runImpactAnalyze(law.id);
      await runConstitutionalReview(law.id);
      await runGenerateCover(law.id);
      await compileLawReport(law.id);
      await runGenerateExplainer(law.id);
      await db.law.update({ where: { id: law.id }, data: { status: "COMPLETE" } });
      await runPatternDetection(law.id);

      console.log(`[ingest] Done Decreto ${decree.lawNumber}`);
      added++;
    } catch (err) {
      console.error(`[ingest] FAILED Decreto ${decree.lawNumber}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n[ingest] ${new Date().toISOString()} — added ${added} new law(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[ingest] Fatal:", err);
  process.exit(1);
});
