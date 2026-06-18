import "../env.js";
import { db } from "@informate/database";

/**
 * Replaces em/en dashes used as punctuation in already-generated content with
 * commas, since the long dash reads as an AI tell. Only touches prose fields;
 * decree numbers (e.g. "70-2026") use a normal hyphen and are untouched.
 */
function clean(s: string): string {
  return s
    .replace(/\s*[—–]\s*/g, ", ") // em/en dash (with any spacing) -> comma
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .trim();
}

function cleanArray(arr: unknown): string[] {
  return Array.isArray(arr) ? arr.map((x) => (typeof x === "string" ? clean(x) : x)) as string[] : (arr as string[]);
}

function cleanObjArray<T extends Record<string, unknown>>(arr: unknown, keys: string[]): T[] {
  if (!Array.isArray(arr)) return arr as T[];
  return arr.map((o) => {
    const obj = { ...(o as Record<string, unknown>) };
    for (const k of keys) if (typeof obj[k] === "string") obj[k] = clean(obj[k] as string);
    return obj as T;
  });
}

async function main() {
  let changed = 0;

  for (const s of await db.lawSummary.findMany()) {
    await db.lawSummary.update({
      where: { id: s.id },
      data: { plainSpanish: clean(s.plainSpanish), keyPoints: cleanArray(s.keyPoints) },
    });
    changed++;
  }

  for (const a of await db.lawAnalysis.findMany()) {
    await db.lawAnalysis.update({
      where: { id: a.id },
      data: {
        causes: clean(a.causes),
        effects: clean(a.effects),
        benefits: clean(a.benefits),
        drawbacks: clean(a.drawbacks),
        sources: cleanObjArray(a.sources, ["title", "description"]),
      },
    });
    changed++;
  }

  for (const i of await db.impactAnalysis.findMany()) {
    await db.impactAnalysis.update({
      where: { id: i.id },
      data: {
        poorImpact: clean(i.poorImpact),
        middleImpact: clean(i.middleImpact),
        wealthyImpact: clean(i.wealthyImpact),
      },
    });
    changed++;
  }

  for (const c of await db.constitutionalReview.findMany()) {
    await db.constitutionalReview.update({
      where: { id: c.id },
      data: {
        findings: clean(c.findings),
        plainSummary: c.plainSummary ? clean(c.plainSummary) : c.plainSummary,
        articles: cleanObjArray(c.articles, ["title", "relevance"]),
      },
    });
    changed++;
  }

  console.log(`[strip-dashes] Cleaned ${changed} record(s).`);
  process.exit(0);
}

main().catch((e) => {
  console.error("[strip-dashes] Fatal:", e);
  process.exit(1);
});
