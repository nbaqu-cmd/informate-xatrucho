import { db } from "@informate/database";
import { generateImageSearchQueries, pickRelevantImage } from "@informate/ai";
import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const IMAGES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "law-images");
const HAS_AWS = Boolean(process.env["AWS_ACCESS_KEY_ID"]);

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

interface OpenverseTag {
  name: string;
}

interface OpenverseResult {
  title: string;
  url: string;
  license: string;
  license_version: string;
  creator: string;
  foreign_landing_url: string;
  tags?: OpenverseTag[];
}

async function searchOpenverse(query: string, photosOnly: boolean): Promise<OpenverseResult[]> {
  try {
    const category = photosOnly ? "&category=photograph" : "";
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}${category}&license_type=commercial,modification&page_size=8`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: OpenverseResult[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

/** Prefers real photographs; only widens to illustrations/other media if no photo matches exist. */
async function searchOpenverseWithFallback(query: string): Promise<OpenverseResult[]> {
  const photos = await searchOpenverse(query, true);
  if (photos.length > 0) return photos;
  return searchOpenverse(query, false);
}

/**
 * Sources a topically relevant, properly licensed photo for a law: derives an
 * English stock-photo search query from the law's actual content, searches
 * Openverse (aggregates CC-licensed images, no API key required), and has a
 * second AI pass reject any candidate that isn't a reasonable match — leaving
 * the law with no image rather than an irrelevant one if nothing fits.
 */
export async function assignLawImage(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({
    where: { id: lawId },
    include: { summary: true },
  });

  const summaryText = law.summary?.plainSpanish ?? law.fullText.slice(0, 2000);
  const queries = await generateImageSearchQueries(law.title, summaryText);

  let chosen: OpenverseResult | undefined;
  let usedQuery = "";
  const seenUrls = new Set<string>();

  for (const query of queries) {
    const candidates = (await searchOpenverseWithFallback(query)).filter(
      (c) => !seenUrls.has(c.url)
    );
    if (candidates.length === 0) continue;
    candidates.forEach((c) => seenUrls.add(c.url));

    const pickIndex = await pickRelevantImage(
      law.title,
      summaryText,
      candidates.map((c) => ({ title: c.title, tags: (c.tags ?? []).map((t) => t.name) }))
    );
    if (pickIndex === null) continue;

    chosen = candidates[pickIndex];
    usedQuery = query;
    break;
  }

  if (!chosen) {
    console.log(
      `[law-image] No relevant candidate for Decreto ${law.lawNumber} (tried: ${queries.join(" / ")})`
    );
    return;
  }
  const query = usedQuery;

  const imageRes = await fetch(chosen.url);
  if (!imageRes.ok) {
    console.log(`[law-image] Failed to download chosen image for Decreto ${law.lawNumber}`);
    return;
  }
  const buffer = Buffer.from(await imageRes.arrayBuffer());

  const extFromUrl = chosen.url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
  const ext = extFromUrl in CONTENT_TYPE_BY_EXT ? extFromUrl : "jpg";
  const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "image/jpeg";

  let imageUrl: string;
  if (HAS_AWS) {
    const { uploadBuffer } = await import("@informate/media");
    imageUrl = await uploadBuffer(buffer, `law-images/${lawId}.${ext}`, contentType);
  } else {
    await mkdir(IMAGES_DIR, { recursive: true });
    await writeFile(join(IMAGES_DIR, `${lawId}.${ext}`), buffer);
    const apiUrl = process.env["API_BASE_URL"] ?? "http://localhost:4000";
    imageUrl = `${apiUrl}/law-images/${lawId}.${ext}`;
  }

  const license = `CC ${chosen.license.toUpperCase()} ${chosen.license_version}`;
  const credit = `Foto: ${chosen.creator || "Autor desconocido"}, ${license} vía Openverse`;

  await db.law.update({
    where: { id: lawId },
    data: { imageUrl, imageCredit: credit, imageSourceUrl: chosen.foreign_landing_url },
  });

  console.log(
    `[law-image] Assigned image to Decreto ${law.lawNumber}: "${chosen.title}" (query: "${query}")`
  );
}
