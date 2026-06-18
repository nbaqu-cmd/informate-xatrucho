import "../env.js";
import { db } from "@informate/database";
import { assignLawCover } from "../services/lawCover.js";

/** Generates the designed cover for every law (replacing any prior image). */
async function main() {
  const laws = await db.law.findMany({ select: { id: true, lawNumber: true }, orderBy: { gazetteDate: "desc" } });
  console.log(`[backfill-covers] Generating covers for ${laws.length} law(s)...\n`);

  let done = 0;
  let failed = 0;
  for (const law of laws) {
    try {
      await assignLawCover(law.id);
      done++;
    } catch (err) {
      console.error(`[backfill-covers] FAILED ${law.lawNumber}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n[backfill-covers] Generated: ${done} | Failed: ${failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[backfill-covers] Fatal:", err);
  process.exit(1);
});
