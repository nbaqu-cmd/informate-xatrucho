import "../env.js";
import { db } from "@informate/database";
import { assignLawImage } from "../services/lawImage.js";

/**
 * Re-sources the hero image for EVERY law with the Honduras-first, strict
 * relevance pipeline — replacing any previously mis-matched image and clearing
 * the image entirely where nothing acceptable exists. Run after changing the
 * image-sourcing logic.
 */
async function main() {
  const laws = await db.law.findMany({ select: { id: true, lawNumber: true }, orderBy: { gazetteDate: "desc" } });
  console.log(`[resource-images] Re-sourcing images for ${laws.length} law(s)...\n`);

  let withImage = 0;
  let without = 0;
  for (const law of laws) {
    try {
      await assignLawImage(law.id);
      const after = await db.law.findUnique({ where: { id: law.id }, select: { imageUrl: true } });
      if (after?.imageUrl) withImage++;
      else without++;
    } catch (err) {
      console.error(`[resource-images] FAILED ${law.lawNumber}:`, err instanceof Error ? err.message : err);
      without++;
    }
  }

  console.log(`\n[resource-images] With image: ${withImage} | Left without (no acceptable match): ${without}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[resource-images] Fatal:", err);
  process.exit(1);
});
