import "../env.js";
import { db } from "@informate/database";
import { fetchCongressDecreesSince } from "@informate/scraper";
import {
  runSummarize,
  runDeepAnalyze,
  runImpactAnalyze,
  runConstitutionalReview,
  runGenerateExplainer,
} from "../services/pipeline.js";
import { compileLawReport } from "../services/report.js";

const SINCE_DATE = new Date(2026, 0, 1); // January 1, 2026 — start of the current Congress term

interface ResultRow {
  lawNumber: string;
  title: string;
  status: "processed" | "skipped" | "failed";
  lawId?: string;
  error?: string;
}

async function main() {
  console.log(`[batch] Discovering Congress decrees since ${SINCE_DATE.toISOString().slice(0, 10)}...`);
  const decrees = await fetchCongressDecreesSince(SINCE_DATE);
  console.log(`[batch] Found ${decrees.length} decree(s).`);

  const results: ResultRow[] = [];

  for (const decree of decrees) {
    console.log(`\n[batch] --- Decreto ${decree.lawNumber}: ${decree.title} ---`);

    const existing = await db.law.findUnique({ where: { lawNumber: decree.lawNumber } });
    if (existing) {
      console.log(`[batch] Already exists (${existing.id}), skipping.`);
      results.push({ lawNumber: decree.lawNumber, title: decree.title, status: "skipped", lawId: existing.id });
      continue;
    }

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
      console.log(`[batch] Created law record ${law.id}`);

      console.log("[batch] Summarizing...");
      await runSummarize(law.id);

      console.log("[batch] Deep analysis...");
      await runDeepAnalyze(law.id);

      console.log("[batch] Impact analysis...");
      await runImpactAnalyze(law.id);

      console.log("[batch] Constitutional review...");
      await runConstitutionalReview(law.id);

      console.log("[batch] Compiling report...");
      await compileLawReport(law.id);

      console.log("[batch] Generating explainer video...");
      await runGenerateExplainer(law.id);

      await db.law.update({ where: { id: law.id }, data: { status: "COMPLETE" } });

      console.log(`[batch] Done: ${law.id}`);
      results.push({ lawNumber: decree.lawNumber, title: decree.title, status: "processed", lawId: law.id });
    } catch (err) {
      console.error(`[batch] FAILED on ${decree.lawNumber}:`, err);
      results.push({
        lawNumber: decree.lawNumber,
        title: decree.title,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  console.log("\n\n========== SUMMARY ==========");
  for (const r of results) {
    console.log(`${r.status.toUpperCase().padEnd(10)} Decreto ${r.lawNumber} — ${r.title} ${r.lawId ? `(${r.lawId})` : ""} ${r.error ?? ""}`);
  }
  console.log(`\nTotal: ${results.length} | Processed: ${results.filter((r) => r.status === "processed").length} | Skipped: ${results.filter((r) => r.status === "skipped").length} | Failed: ${results.filter((r) => r.status === "failed").length}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("[batch] Fatal error:", err);
  process.exit(1);
});
