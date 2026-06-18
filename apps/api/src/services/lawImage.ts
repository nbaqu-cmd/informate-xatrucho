import { db } from "@informate/database";
import { generateImageQueryPlan, rankRelevantImages, type ImageCandidate } from "@informate/ai";
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

/** A vetted, downloadable image with the attribution a news outlet must show. */
export interface SourcedImage {
  downloadUrl: string;
  title: string;
  credit: string;
  sourceUrl: string;
  source: string;
  candidate: ImageCandidate;
}

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

interface CommonsResult {
  title: string;
  imageinfo?: Array<{
    url: string;
    thumburl?: string;
    mime?: string;
    descriptionurl?: string;
    extmetadata?: {
      LicenseShortName?: { value: string };
      Artist?: { value: string };
      ImageDescription?: { value: string };
    };
  }>;
}

/**
 * Searches Wikimedia Commons for real, freely-licensed photographs matching a
 * Honduras-specific query. Commons is where genuine Honduran imagery lives
 * (the National Police, the Congress, named officials, Honduran towns), so it
 * is the primary source. Logos, maps, SVGs and other non-photographic files
 * are filtered out here; topical/geographic relevance is judged downstream.
 */
async function fetchCommons(query: string): Promise<Record<string, CommonsResult> | null> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8` +
    `&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=1200&format=json&origin=*`;
  // Commons throttles bursts with a non-JSON "too many requests" body; retry with backoff.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "InformateXatrucho/1.0 (news transparency; contact: informate)" },
      });
      const body = await res.text();
      if (res.ok && body.startsWith("{")) {
        const data = JSON.parse(body) as { query?: { pages?: Record<string, CommonsResult> } };
        return data.query?.pages ?? {};
      }
    } catch {
      // fall through to retry
    }
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
  return null;
}

async function searchWikimediaCommons(query: string): Promise<SourcedImage[]> {
  try {
    const pagesMap = await fetchCommons(query);
    if (!pagesMap) return [];
    const pages = Object.values(pagesMap);

    const out: SourcedImage[] = [];
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const mime = ii.mime ?? "";
      if (!/^image\/(jpeg|png|webp)$/.test(mime)) continue; // photos only — skip svg/gif/tiff
      const titleClean = p.title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, "");
      // Skip obvious non-photo files by name (logos, seals, maps, coats of arms, emblems).
      if (/\b(logo|escudo|seal|coat of arms|emblem|emblema|insignia|map|mapa|flag|bandera|monograma|diagram)\b/i.test(titleClean)) continue;

      const license = ii.extmetadata?.LicenseShortName?.value ?? "Licencia libre";
      const author = stripHtml(ii.extmetadata?.Artist?.value) || "Autor desconocido";
      const description = stripHtml(ii.extmetadata?.ImageDescription?.value);
      // Map-generator authors (e.g. "paintmaps") produce data-map graphics that
      // slip past the title filter ("Honduras Elections 2025") — skip them.
      if (/\b(paintmaps|mapchart|cartogr)\b/i.test(author)) continue;
      out.push({
        downloadUrl: ii.thumburl ?? ii.url,
        title: titleClean,
        credit: `Foto: ${author}, ${license} vía Wikimedia Commons`,
        sourceUrl: ii.descriptionurl ?? "",
        source: "Wikimedia Commons (Honduras)",
        candidate: { title: titleClean, description, tags: [], source: "Wikimedia Commons (Honduras)" },
      });
    }
    return out;
  } catch {
    return [];
  }
}

interface OpenverseResult {
  title: string;
  url: string;
  license: string;
  license_version: string;
  creator: string;
  foreign_landing_url: string;
  tags?: Array<{ name: string }>;
}

/**
 * Searches Openverse for a neutral, country-agnostic close-up (a ballot, a
 * document, money) used only as a non-misleading fallback when no genuine
 * Honduran photo exists. Photographs only, reusable licenses only.
 */
async function searchOpenverseGeneric(query: string): Promise<SourcedImage[]> {
  try {
    const res = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}` +
        `&category=photograph&license_type=commercial,modification&page_size=6`
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: OpenverseResult[] };
    return (data.results ?? []).map((r) => ({
      downloadUrl: r.url,
      title: r.title,
      credit: `Foto: ${r.creator || "Autor desconocido"}, CC ${r.license.toUpperCase()} ${r.license_version} vía Openverse`,
      sourceUrl: r.foreign_landing_url,
      source: "Openverse (genérica)",
      candidate: {
        title: r.title,
        tags: (r.tags ?? []).map((t) => t.name),
        source: "Openverse (genérica)",
      },
    }));
  } catch {
    return [];
  }
}

/**
 * Sources verified, properly-licensed images for a law under a news outlet's
 * standard: searches Honduras-specific Wikimedia Commons first, then neutral
 * generic photos, and has an AI editor reject anything misleading (e.g. a
 * foreign police photo for a Honduran police law) before returning the
 * acceptable images ranked best-first. Returns [] rather than a wrong image.
 */
export async function sourceLawImages(
  title: string,
  summaryText: string,
  maxCount: number
): Promise<SourcedImage[]> {
  const plan = await generateImageQueryPlan(title, summaryText);

  // Commons rate-limits bursts, so query it sequentially with a brief pause; Openverse is separate.
  const pools: SourcedImage[][] = [];
  for (const q of plan.hondurasQueries) {
    pools.push(await searchWikimediaCommons(q));
    await new Promise((r) => setTimeout(r, 300));
  }
  pools.push(...(await Promise.all(plan.genericQueries.map((q) => searchOpenverseGeneric(q)))));

  // Honduran (Commons) candidates first, then generic; de-dupe by URL.
  const seen = new Set<string>();
  const candidates: SourcedImage[] = [];
  for (const pool of pools) {
    for (const img of pool) {
      if (seen.has(img.downloadUrl)) continue;
      seen.add(img.downloadUrl);
      candidates.push(img);
    }
  }
  if (candidates.length === 0) return [];

  const ranked = await rankRelevantImages(
    plan.subject,
    summaryText,
    candidates.map((c) => c.candidate)
  );

  return ranked.slice(0, maxCount).map((i) => candidates[i]!);
}

async function storeImage(buffer: Buffer, lawId: string, ext: string, contentType: string): Promise<string> {
  if (HAS_AWS) {
    const { uploadBuffer } = await import("@informate/media");
    return uploadBuffer(buffer, `law-images/${lawId}.${ext}`, contentType);
  }
  await mkdir(IMAGES_DIR, { recursive: true });
  await writeFile(join(IMAGES_DIR, `${lawId}.${ext}`), buffer);
  const apiUrl = process.env["API_BASE_URL"] ?? "http://localhost:4000";
  return `${apiUrl}/law-images/${lawId}.${ext}`;
}

/**
 * Assigns the single best vetted hero image to a law, or clears the image if
 * nothing acceptable was found — never leaving a previously-wrong image in place.
 */
export async function assignLawImage(lawId: string): Promise<void> {
  const law = await db.law.findUniqueOrThrow({ where: { id: lawId }, include: { summary: true } });
  const summaryText = law.summary?.plainSpanish ?? law.fullText.slice(0, 2000);

  const [best] = await sourceLawImages(law.title, summaryText, 1);

  if (!best) {
    // Prefer no image over a misleading one; also clear any prior wrong image.
    await db.law.update({
      where: { id: lawId },
      data: { imageUrl: null, imageCredit: null, imageSourceUrl: null },
    });
    console.log(`[law-image] No acceptable image for Decreto ${law.lawNumber} — left without one.`);
    return;
  }

  const imageRes = await fetch(best.downloadUrl, {
    headers: { "User-Agent": "InformateXatrucho/1.0 (news transparency)" },
  });
  if (!imageRes.ok) {
    console.log(`[law-image] Download failed for Decreto ${law.lawNumber}`);
    return;
  }
  const buffer = Buffer.from(await imageRes.arrayBuffer());

  const extFromUrl = best.downloadUrl.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
  const ext = extFromUrl in CONTENT_TYPE_BY_EXT ? extFromUrl : "jpg";
  const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "image/jpeg";

  const imageUrl = await storeImage(buffer, lawId, ext, contentType);

  await db.law.update({
    where: { id: lawId },
    data: { imageUrl, imageCredit: best.credit, imageSourceUrl: best.sourceUrl },
  });

  console.log(`[law-image] Decreto ${law.lawNumber}: "${best.title}" (${best.source})`);
}
