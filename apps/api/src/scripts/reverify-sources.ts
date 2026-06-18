import "../env.js";
import { db } from "@informate/database";
import { verifyAndEnrichSources } from "../services/sources.js";
import type { Source } from "@informate/ai";

/**
 * Re-checks every existing law's cited sources, dropping dead/hallucinated
 * links and prepending the official Gazette source, so the "fuentes" count is
 * honest. Does not re-run the (expensive) analysis — only the source list.
 */
async function main() {
  const laws = await db.law.findMany({
    where: { analysis: { isNot: null } },
    select: { id: true, lawNumber: true, sourceUrl: true, gazetteNumber: true, analysis: { select: { sources: true } } },
  });
  console.log(`[reverify] Checking sources for ${laws.length} law(s)...\n`);

  for (const law of laws) {
    const before = (law.analysis?.sources as Source[]) ?? [];
    const verified = await verifyAndEnrichSources(before, { url: law.sourceUrl, gazetteNumber: law.gazetteNumber });
    await db.lawAnalysis.update({ where: { lawId: law.id }, data: { sources: verified } });
    console.log(`[reverify] Decreto ${law.lawNumber}: ${before.length} citadas -> ${verified.length} verificadas (incl. Gaceta)`);
  }

  console.log("\n[reverify] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[reverify] Fatal:", err);
  process.exit(1);
});
