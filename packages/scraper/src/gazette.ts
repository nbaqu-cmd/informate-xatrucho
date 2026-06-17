import * as cheerio from "cheerio";
import dns from "node:dns";
import { Agent, fetch as undiciFetch } from "undici";

// Some networks transparently intercept plain DNS (port 53) and return bad/empty
// answers for this host even though the site itself is reachable — the OS resolver
// and even explicit resolve4() to 1.1.1.1 can fail this way. DNS-over-HTTPS (port 443)
// isn't interceptable the same way, so fall back to it when the normal lookup fails.
const dohCache = new Map<string, string>();

async function resolveViaDoh(hostname: string): Promise<string | null> {
  const cached = dohCache.get(hostname);
  if (cached) return cached;
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
      headers: { accept: "application/dns-json" },
    });
    const data = (await res.json()) as { Answer?: Array<{ data: string; type: number }> };
    const ip = data.Answer?.find((a) => a.type === 1)?.data;
    if (ip) {
      dohCache.set(hostname, ip);
      return ip;
    }
  } catch {
    // fall through to caller's error handling
  }
  return null;
}

function resilientLookup(
  hostname: string,
  options: dns.LookupOneOptions,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
): void {
  dns.lookup(hostname, options, (err, address, family) => {
    if (!err) return callback(null, address as string, family as number);
    resolveViaDoh(hostname).then((ip) => {
      if (ip) return callback(null, ip, 4);
      callback(err, address as unknown as string, family as number);
    });
  });
}

const resilientAgent = new Agent({ connect: { lookup: resilientLookup } });

async function resilientFetch(url: string): Promise<Response> {
  return undiciFetch(url, { dispatcher: resilientAgent }) as unknown as Promise<Response>;
}

const ENAG_BASE = "https://enag.gob.hn";

const MONTHS_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export interface GazetteLawCandidate {
  gazetteNumber: string;
  gazetteDate: Date;
  decreeNumber: string;
  slug: string;
  downloadUrl: string;
}

export interface GazetteLaw {
  gazetteNumber: string;
  gazetteDate: Date;
  lawNumber: string;
  title: string;
  fullText: string;
  sourceUrl: string;
}

function parseSlugDate(slug: string): { date: Date; gazetteNumber: string } {
  // slug like "20260109-37039"
  const [datePart, gazetteNumber] = slug.split("-");
  if (!datePart || !gazetteNumber) throw new Error(`Unexpected slug format: ${slug}`);
  const year = Number(datePart.slice(0, 4));
  const month = Number(datePart.slice(4, 6));
  const day = Number(datePart.slice(6, 8));
  return { date: new Date(year, month - 1, day), gazetteNumber };
}

/**
 * Scans one month's gazette listing on enag.gob.hn and returns only the
 * issues whose bundled description mentions "PODER LEGISLATIVO" — i.e.
 * issues that contain a decree passed by the National Congress, as opposed
 * to ministerial agreements or executive-branch resolutions.
 */
export async function findCongressDecreesInMonth(
  year: number,
  monthIndex: number // 0-11
): Promise<GazetteLawCandidate[]> {
  const monthName = MONTHS_ES[monthIndex];
  const url = `${ENAG_BASE}/index.php/gaceta-digital/${year}/${monthName}`;

  const res = await resilientFetch(url);
  if (!res.ok) return [];
  const html = await res.text();
  const $ = cheerio.load(html);

  const candidates: GazetteLawCandidate[] = [];

  $(".edocman-document").each((_, el) => {
    const $el = $(el);
    const titleAttr = $el.find(".edocman-document-title-link").first().attr("title")?.trim();
    if (!titleAttr) return;

    const slug = titleAttr.replace(/\s*-\s*/, "-"); // "20260109 - 37039" -> "20260109-37039"

    const descriptionHtml = $el.find(".edocman-description-details").html() ?? "";
    const match = descriptionHtml.match(
      /PODER LEGISLATIVO<\/strong>\s*<br\s*\/?>\s*Decreto No\.?\s*([\d-]+)/i
    );
    if (!match || !match[1]) return;

    const { date, gazetteNumber } = parseSlugDate(slug);

    candidates.push({
      gazetteNumber,
      gazetteDate: date,
      decreeNumber: match[1],
      slug,
      downloadUrl: `${ENAG_BASE}/index.php/gaceta-digital/${slug}/download`,
    });
  });

  return candidates;
}

const MAX_DECREE_LENGTH = 30_000;

/**
 * Isolates the actual decree body from a gazette PDF that bundles multiple
 * agencies' publications into one document.
 *
 * The first "PODER LEGISLATIVO" occurrence in these PDFs is usually just the
 * table-of-contents entry (e.g. "PODER LEGISLATIVO / Decreto No. 58-2025 /
 * A.1-8"), not the real text. The enacting clause "EL CONGRESO NACIONAL,"
 * only ever appears in the real decree body, so we anchor on that instead
 * and walk backward to include the "DECRETO No." heading.
 */
function extractLegislativeSection(fullText: string): string | null {
  const congresoMatch = fullText.match(/EL CONGRESO NACIONAL\s*,/i);
  if (!congresoMatch || congresoMatch.index === undefined) return null;

  const anchor = congresoMatch.index;
  const lookbackWindow = fullText.slice(Math.max(0, anchor - 500), anchor);
  const headingMatch = lookbackWindow.match(/DECRETO\s+No\.?\s*[\d-]+/i);

  const sectionStart = headingMatch?.index !== undefined
    ? Math.max(0, anchor - 500) + headingMatch.index
    : anchor;

  const rest = fullText.slice(anchor);
  const nextHeadingMatch = rest.match(
    /\n\s*(PODER EJECUTIVO|SECRETAR[ÍI]A DE ESTADO|INSTITUTO|COMISI[ÓO]N|MUNICIPALIDAD|Secci[óo]n B)[A-Za-zÁÉÍÓÚÑáéíóúñ\s,.]{0,80}\n/
  );
  const naturalEnd = nextHeadingMatch?.index
    ? anchor + nextHeadingMatch.index
    : fullText.length;

  const sectionEnd = Math.min(naturalEnd, sectionStart + MAX_DECREE_LENGTH);

  return fullText.slice(sectionStart, sectionEnd).trim();
}

function extractDecreeTitle(decreeText: string): string | null {
  const match = decreeText.match(
    /DECRETO\s+No\.?\s*[\d-]+\s*([\s\S]{0,300}?)(?:CONSIDERANDO|EL CONGRESO NACIONAL)/i
  );
  if (match && match[1]) {
    const candidate = match[1].replace(/\s+/g, " ").trim();
    if (candidate.length > 5 && candidate.length < 200) return candidate;
  }
  return null;
}

export async function downloadAndExtractDecree(
  candidate: GazetteLawCandidate
): Promise<GazetteLaw | null> {
  const res = await resilientFetch(candidate.downloadUrl);
  if (!res.ok) return null;

  const buffer = await res.arrayBuffer();
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(Buffer.from(buffer));

  const decreeText = extractLegislativeSection(data.text);
  if (!decreeText) return null;

  const title = extractDecreeTitle(decreeText) ?? `Decreto No. ${candidate.decreeNumber}`;

  return {
    gazetteNumber: candidate.gazetteNumber,
    gazetteDate: candidate.gazetteDate,
    lawNumber: candidate.decreeNumber,
    title,
    fullText: decreeText,
    sourceUrl: candidate.downloadUrl,
  };
}

/**
 * Walks month-by-month from `sinceDate` to the present, returning every
 * Congress decree found along the way. Network/PDF cost only — no AI calls.
 */
export async function fetchCongressDecreesSince(sinceDate: Date): Promise<GazetteLaw[]> {
  const laws: GazetteLaw[] = [];
  const now = new Date();

  let year = sinceDate.getFullYear();
  let month = sinceDate.getMonth();

  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    const candidates = await findCongressDecreesInMonth(year, month);

    for (const candidate of candidates) {
      if (candidate.gazetteDate < sinceDate) continue;
      const law = await downloadAndExtractDecree(candidate);
      if (law) laws.push(law);
    }

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  return laws;
}
