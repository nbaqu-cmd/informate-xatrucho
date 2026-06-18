import "../env.js";
import { db, LawStatus } from "@informate/database";
import { downloadAndExtractDecree, type GazetteLawCandidate } from "@informate/scraper";
import {
  runSummarize,
  runDeepAnalyze,
  runImpactAnalyze,
  runConstitutionalReview,
} from "../services/pipeline.js";
import { compileLawReport } from "../services/report.js";
import { runPatternDetection } from "../services/patterns.js";

/**
 * Re-runs the (now decree-number-anchored) gazette extraction against every
 * existing law's original source PDF, since the previous extraction anchored
 * on a brittle "EL CONGRESO NACIONAL," phrase match that silently grabbed the
 * wrong section for several laws (signature blocks, table-of-contents text).
 * Any law whose corrected text differs gets its content updated and the full
 * AI pipeline re-run so the analysis reflects the real decree.
 */
async function main() {
  const laws = await db.law.findMany({
    select: { id: true, lawNumber: true, title: true, fullText: true, gazetteNumber: true, gazetteDate: true, sourceUrl: true },
  });
  console.log(`[refix] Checking ${laws.length} law(s) against corrected extraction...\n`);

  let unchanged = 0;
  let stillFailed = 0;
  let fixed = 0;

  for (const law of laws) {
    const candidate: GazetteLawCandidate = {
      gazetteNumber: law.gazetteNumber,
      gazetteDate: law.gazetteDate,
      decreeNumber: law.lawNumber,
      slug: "",
      downloadUrl: law.sourceUrl,
    };

    let extracted;
    try {
      extracted = await downloadAndExtractDecree(candidate);
    } catch (err) {
      console.error(`[refix] FETCH/PARSE ERROR on ${law.lawNumber}:`, err instanceof Error ? err.message : err);
      stillFailed++;
      continue;
    }

    if (!extracted) {
      console.log(`[refix] Decreto ${law.lawNumber}: still no valid decree body found (unchanged).`);
      stillFailed++;
      continue;
    }

    if (extracted.fullText.trim() === law.fullText.trim() && extracted.title === law.title) {
      unchanged++;
      continue;
    }

    console.log(`[refix] Decreto ${law.lawNumber}: content changed (${law.fullText.length} -> ${extracted.fullText.length} chars). Title: "${law.title}" -> "${extracted.title}"`);

    try {
      await db.law.update({
        where: { id: law.id },
        data: { fullText: extracted.fullText, title: extracted.title },
      });

      await runSummarize(law.id);
      await runDeepAnalyze(law.id);
      await runImpactAnalyze(law.id);
      await runConstitutionalReview(law.id);
      await compileLawReport(law.id);
      await db.law.update({ where: { id: law.id }, data: { status: LawStatus.COMPLETE } });
      await runPatternDetection(law.id);

      console.log(`[refix] Decreto ${law.lawNumber}: re-processed successfully.`);
      fixed++;
    } catch (err) {
      console.error(`[refix] PIPELINE ERROR on ${law.lawNumber}:`, err instanceof Error ? err.message : err);
      stillFailed++;
    }
  }

  console.log(`\n[refix] Unchanged: ${unchanged} | Fixed & reprocessed: ${fixed} | Still no valid content: ${stillFailed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[refix] Fatal error:", err);
  process.exit(1);
});
