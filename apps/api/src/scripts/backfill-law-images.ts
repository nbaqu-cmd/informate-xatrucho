import "../env.js";
import { db } from "@informate/database";
import { assignLawImage } from "../services/lawImage.js";

async function main() {
  const laws = await db.law.findMany({
    where: { imageUrl: null },
    select: { id: true, lawNumber: true },
  });
  console.log(`[backfill-images] Found ${laws.length} law(s) without an image.`);

  let assigned = 0;
  let skipped = 0;
  for (const law of laws) {
    try {
      const before = await db.law.findUnique({ where: { id: law.id }, select: { imageUrl: true } });
      await assignLawImage(law.id);
      const after = await db.law.findUnique({ where: { id: law.id }, select: { imageUrl: true } });
      if (!before?.imageUrl && after?.imageUrl) assigned++;
      else skipped++;
    } catch (err) {
      console.error(`[backfill-images] FAILED on ${law.lawNumber}:`, err instanceof Error ? err.message : err);
      skipped++;
    }
  }

  console.log(`\n[backfill-images] Assigned: ${assigned} | No relevant match found: ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[backfill-images] Fatal error:", err);
  process.exit(1);
});
