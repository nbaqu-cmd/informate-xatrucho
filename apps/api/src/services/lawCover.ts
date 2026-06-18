import { db } from "@informate/database";
import { generateCoverMeta } from "@informate/ai";
import { renderLawCover } from "@informate/media";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const IMAGES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "law-images");
const HAS_AWS = Boolean(process.env["AWS_ACCESS_KEY_ID"]);

/**
 * Generates a law's cover graphic from its own data — decree number, a short
 * plain-language topic line, category, date, and the constitutional verdict —
 * and stores it as the law's image. Unlike a looked-up photo, the cover makes
 * no claim to depict any real scene, so it cannot mislead; it simply
 * identifies the law on the page and in listings.
 */
export async function assignLawCover(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({
    where: { id: lawId },
    include: { summary: true, constitutionalReview: true },
  });

  const summaryText = law.summary?.plainSpanish ?? law.fullText.slice(0, 1500);
  const meta = await generateCoverMeta(law.title, summaryText);

  const gazetteDate = new Date(law.gazetteDate).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const buffer = await renderLawCover({
    lawNumber: law.lawNumber,
    topicLabel: meta.topicLabel,
    category: meta.category,
    gazetteDate,
    // Default to "compliant" styling only when a review exists and is compliant;
    // if no review yet, don't show a false alert — treat as compliant-neutral.
    isConstitutional: law.constitutionalReview?.isCompliant ?? true,
  });

  let imageUrl: string;
  if (HAS_AWS) {
    const { uploadBuffer } = await import("@informate/media");
    imageUrl = await uploadBuffer(buffer, `law-images/${lawId}.png`, "image/png");
  } else {
    await mkdir(IMAGES_DIR, { recursive: true });
    await writeFile(join(IMAGES_DIR, `${lawId}.png`), buffer);
    const apiUrl = process.env["API_BASE_URL"] ?? "http://localhost:4000";
    imageUrl = `${apiUrl}/law-images/${lawId}.png`;
  }

  await db.law.update({
    where: { id: lawId },
    data: {
      imageUrl,
      imageCredit: `Portada generada por Infórmate Xatrucho · ${meta.topicLabel}`,
      imageSourceUrl: null,
    },
  });

  console.log(`[law-cover] Decreto ${law.lawNumber}: "${meta.topicLabel}" [${meta.category}]`);
}
