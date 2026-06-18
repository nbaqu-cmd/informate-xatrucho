import "../env.js";
import { db } from "@informate/database";
import { findCongressDecreesInMonth } from "@informate/scraper";

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio"];

async function main() {
  const inDb = await db.law.count();
  console.log(`Laws currently in DB: ${inDb}\n`);

  let totalCandidates = 0;
  for (let m = 0; m < 6; m++) {
    try {
      const candidates = await findCongressDecreesInMonth(2026, m);
      totalCandidates += candidates.length;
      console.log(`${MONTHS[m]} 2026: ${candidates.length} issue(s) tagged PODER LEGISLATIVO`);
      for (const c of candidates) {
        console.log(`   - Gaceta ${c.gazetteNumber} (${c.gazetteDate.toISOString().slice(0, 10)}) -> Decreto ${c.decreeNumber}`);
      }
    } catch (err) {
      console.log(`${MONTHS[m]} 2026: ERROR ${err instanceof Error ? err.message : err}`);
    }
  }
  const uniqueCount = inDb; // for reference vs what's stored
  console.log(`\nTotal decree candidates discovered (Jan-Jun 2026): ${totalCandidates}`);
  console.log(`Currently stored: ${uniqueCount}. Run the ingest to process the rest.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
