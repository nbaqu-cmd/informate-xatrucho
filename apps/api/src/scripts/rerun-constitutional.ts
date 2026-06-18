import "../env.js";
import { db } from "@informate/database";
import { runConstitutionalReview, runGenerateCover } from "../services/pipeline.js";

/**
 * Re-runs the constitutional review for every law under the reframed,
 * more prudent prompt (preliminary review, not a ruling) and the expanded
 * constitution reference, then regenerates each cover since the alert state
 * may change.
 */
async function main() {
  const laws = await db.law.findMany({ select: { id: true, lawNumber: true }, orderBy: { gazetteDate: "desc" } });
  console.log(`[rerun-const] Re-reviewing ${laws.length} law(s)...\n`);

  for (const law of laws) {
    try {
      await runConstitutionalReview(law.id);
      const cr = await db.constitutionalReview.findUnique({ where: { lawId: law.id }, select: { isCompliant: true } });
      await runGenerateCover(law.id);
      console.log(`[rerun-const] Decreto ${law.lawNumber}: ${cr?.isCompliant ? "sin tensiones" : "POSIBLES TENSIONES"}`);
    } catch (err) {
      console.error(`[rerun-const] FAILED ${law.lawNumber}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("\n[rerun-const] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[rerun-const] Fatal:", err);
  process.exit(1);
});
