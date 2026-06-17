import "../env.js";
import { db, LawStatus } from "@informate/database";
import { compileLawReport } from "../services/report.js";
import { runPatternDetection } from "../services/patterns.js";

async function main() {
  const laws = await db.law.findMany({
    where: { report: null },
    select: { id: true, lawNumber: true, title: true },
  });
  console.log(`[repair] Found ${laws.length} law(s) missing a report.`);

  let fixed = 0;
  let failed = 0;
  for (const law of laws) {
    try {
      console.log(`[repair] Compiling report for Decreto ${law.lawNumber}...`);
      await compileLawReport(law.id);
      await db.law.update({ where: { id: law.id }, data: { status: LawStatus.COMPLETE } });
      await runPatternDetection(law.id);
      console.log(`[repair] Done: ${law.lawNumber}`);
      fixed++;
    } catch (err) {
      console.error(`[repair] FAILED on ${law.lawNumber}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n[repair] Fixed: ${fixed} | Failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[repair] Fatal error:", err);
  process.exit(1);
});
