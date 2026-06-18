import "../env.js";
import { db } from "@informate/database";
import { generateExplainer } from "../services/explainer.js";

/**
 * Generates the narrated website explainer video for every law that has
 * complete analysis but no explainer yet. Idempotent: skips laws that already
 * have a WEBSITE_EXPLAINER video, so it can be re-run safely. Rendering is
 * slow (minutes per law), so this is meant to run as a long background batch.
 */
async function main() {
  const laws = await db.law.findMany({
    where: {
      constitutionalReview: { isNot: null },
      summary: { isNot: null },
      analysis: { isNot: null },
      impactAnalysis: { isNot: null },
    },
    select: {
      id: true,
      lawNumber: true,
      videos: { where: { type: "WEBSITE_EXPLAINER" }, select: { id: true } },
    },
    orderBy: { gazetteDate: "desc" },
  });

  const pending = laws.filter((l) => l.videos.length === 0);
  console.log(`[backfill-explainers] ${laws.length} eligible law(s), ${pending.length} need a video.`);

  let done = 0;
  let failed = 0;
  for (const law of pending) {
    try {
      console.log(`\n[backfill-explainers] === Decreto ${law.lawNumber} (${done + failed + 1}/${pending.length}) ===`);
      const t0 = Date.now();
      await generateExplainer(law.id);
      console.log(`[backfill-explainers] Decreto ${law.lawNumber} done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      done++;
    } catch (err) {
      console.error(`[backfill-explainers] FAILED ${law.lawNumber}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n[backfill-explainers] Generated: ${done} | Failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[backfill-explainers] Fatal:", err);
  process.exit(1);
});
